$(document).ready(function() {

    $("#contact-form [type='submit']").click(function(e) {
        e.preventDefault();
        
        // Get input field values of the contact form

        var current_domain  = window.location.hostname;
        var send_toEmail    ='support@shelyuu.com';
        var template_id     ='195637';
        var template_type    ='1';

        var user_message    = $('textarea[name=message]').val();
        var user_message    = $('textarea[name=message]').val();

        var user_checking   = $('input[name=checking]').val(); // Anti-spam field

        var user_name       = $('input[name=name]').val();
        var user_email      = $('input[name=email-address]').val();
        var user_company    = $('input[name=company]').val();
        var user_phone      = $('input[name=phone]').val();
        var user_message    = $('textarea[name=message]').val();
       
        // Datadata to be sent to server
        post_data = {'fromWebsite':current_domain,'sendtoEmail':send_toEmail,'templateId':template_id,'templateType':template_type,
        'userChecking':user_checking, 'userName':user_name, 'userEmail':user_email, 'userCompany':user_company, 'userPhone':user_phone, 'userMessage':user_message};
       
        $("#answer").hide().html('Your message has been submitted.').fadeIn();

        // Ajax post data to server
        $.post('https://api.shelyuu.com/api/sendmessage', post_data, function(response){  
           
            // Load json data from server and output message    
            if(response.type == 'error') {

                output = '<div class="error-message"><p>'+response.text+'</p></div>';
                
            } else {
           
                output = '<div class="success-message"><p>'+response.text+'</p></div>';

                $("#contact-form").fadeOut();
               
                // After, all the fields are reseted
                $('#contact-form input').val('');
                $('#contact-form textarea').val('');
                
            }
           
            $("#answer").hide().html(output).fadeIn();

        }, 'json');

        // $.ajax({
        //     url: 'https://api.shelyuu.com/api/sendmessage',
        //     type: 'POST',
        //     data: post_data,
        //     headers: {
        //         // Add other headers if needed
        //         // 'Header-Name': 'Header-Value'
        //     },
        //     success: function(response) {
        //         // Load json data from server and output message    
        //         if(response.type == 'error') {

        //             output = '<div class="error-message"><p>'+response.text+'</p></div>';
                    
        //         } else {
            
        //             output = '<div class="success-message"><p>'+response.text+'</p></div>';

        //             $("#contact-form").fadeOut();
                
        //             // After, all the fields are reseted
        //             $('#contact-form input').val('');
        //             $('#contact-form textarea').val('');
                    
        //         }
        //         $("#answer").hide().html(output).fadeIn();
        //     },
        //     error: function(error) {
        //         // Handle errors here
        //         output = '<div class="error-message"><p>'+error+'</p></div>';
        //         $("#answer").hide().html(output).fadeIn();
        //     }
        // }, 'json');

    });
   
    // Reset and hide all messages on .keyup()
    $("#contact-form input, #contact-form textarea").keyup(function() {
        $("#answer").fadeOut();
    });

    // Accept only figure from 0 to 9 and + ( ) in the phone field
    $("#contact-form #phone").keyup(function() {
        $("#phone").val(this.value.match(/[0-9 + ( )]*/));
    });
   
});