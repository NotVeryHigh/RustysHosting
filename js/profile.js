var url = $(location).attr('href');
if(url.indexOf("#accountsettings") > -1)
{
    $("#acc-settings-btn").trigger('click');
} else if(url.indexOf("#servers") > -1)
{
    $("#servers-btn").trigger('click');
} else if(url.indexOf("#support") > -1)
{
    $("#support-btn").trigger('click');
} else if (url.indexOf("#faq") > -1)
{
    $("#faq-btn").trigger('click');
}

$("#account-settings").submit(ajaxForm);
$("#password-form").submit(ajaxForm);
$("#support-form").submit(ajaxForm);

function ajaxForm(formEvent)
{
    formEvent.preventDefault();

    var form = $(this);
    var url = form.attr('action');

    $.ajax({
        type: "POST",
        url: url,
        data: form.serialize(),
        success: function(data) {
            form.after(data);
        }
    });
}

var countDown = new Date($(".popup-bold-text").attr("data-time")).getTime();
var countDownInterval = setInterval(function() {
    var now = new Date().getTime();

    var distance = countDown - now;

    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    $(".popup-bold-text").html(hours + "h "+ minutes + "m " + seconds + "s ");

    // If the count down is finished, write some text
    if (distance < 0) {
        clearInterval(countDownInterval);
        $(".popup-bold-text").html("EXPIRED");
    }
}, 1000);