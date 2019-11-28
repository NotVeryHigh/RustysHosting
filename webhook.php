<?php

require_once 'core/init.php';

\Stripe\Stripe::setApiKey(Config::get('stripe/secret_api_key'));

$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
$event = null;

try {
    $event = \Stripe\Webhook::constructEvent(
        $payload, $sig_header, Config::get('stripe/signing_secret')
    );
} catch (\UnexpectedValueException $e) {
    http_response_code(400);
    exit();
} catch(\Stripe\Exception\SignatureVerificationException $e) {
    http_response_code(400);
    exit();
}

switch ($event->type) {
    case 'checkout.session.completed':
        handleCheckoutSessionSucceeded($event->data->object);
    break;
    case 'invoice.payment_succeeded':
        handleInvoicePaymentSucceeded($event->data->object);
    break;
}

http_response_code(200);
# "billing_reason": "subscription_cycle",
function handleInvoicePaymentSucceeded($invoice)
{
    if($invoice->billing_reason === "subscription_cycle")
    {
        $db = DB::getInstance();
        $subscription_id = $invoice->lines->data[0]->subscription;
        $plans = $db->get('services', array('stripe_id', '=', $subscription_id));
        if($plans->count())
        {
            $datetime = new DateTime("+1 month");
            $expiry = $datetime->format('Y-m-d H:i:s');
            $result = $db->update('services', $plans->first()->id, array(
                'expiry' => $expiry
            ));
            if(!$result)
            {
                print_r($db->errorInfo());
            }
        }
    }
}

function handleCheckoutSessionSucceeded($checkout) {
    if($checkout->mode === "subscription")
    {
        $db = DB::getInstance();
        $subscription = \Stripe\Subscription::retrieve(
            $checkout->subscription
        );
        print_r($subscription->metadata);
        $users = $db->get('users', array('id', '=', $subscription->metadata->user_id));
        if($users->count()) {
            $user = $users->first();
            $plan_id = $subscription->items->data[0]->plan->id;
            $plans = $db->get('plans', array('stripe_id', '=', $plan_id));
            if($plans->count()) {
                $service = new Service();
                $service->create($plans->first()->id, $user->id, $subscription->id, 1, $subscription->metadata->region_id);
                if(empty($user->stripe_id)) {
                    $db->update('users', $user->id, $checkout->customer);
                }
            }
        }
    } else if ($checkout->mode === "setup") {
        $setup_intent = \Stripe\SetupIntent::retrieve($checkout->setup_intent);
        print_r($setup_intent);
        $payment_method = \Stripe\PaymentMethod::retrieve($setup_intent->payment_method);
        $payment_method->attach(['customer' => $setup_intent->metadata->customer_id]);
        \Stripe\Subscription::update(
            $setup_intent->metadata->subscription_id,
            [
                'default_payment_method' => $setup_intent->payment_method,
            ]);
    }
}