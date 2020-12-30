var $form = $('#contact-form');
// init the validator
// validator files are included in the download package
// otherwise download from http://1000hz.github.io/bootstrap-validator
$form.validator();

$(function () {
  // when the form is submitted
  $form.on('submit', function (e) {

    // if the validator does not prevent form submit
    if (!e.isDefaultPrevented()) {

      // use regular form submit then only validate, don't ajax submit
      if ($('#form_use').val() === '1') {
        return true;
      }

      var url = $form.attr('action');

      // POST values in the background the the script URL
      $.ajax({
        type: "POST",
        url: url,
        data: $form.serialize(),
        success: function (data)
        {
          // data = JSON object that returns

          // we recieve the type of the message: success x danger and apply it to the
          var messageAlert = 'alert-' + data.type;
          var messageText = data.message;

          // let's compose Bootstrap alert box HTML
          var alertBox = '<div class="alert ' + messageAlert + ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + messageText + '</div>';

          // If we have messageAlert and messageText
          if (messageAlert && messageText) {
            // inject the alert to .messages div in our form
            $form.find('.messages').html(alertBox);
            // empty the form
            $form[0].reset();
          }
        }
      });

      return false;
    }
  });
});
