from templates import get_template_content
from flask import Flask, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Send email using the retrieved template content
def send_email(user_name, user_email, user_company, user_phone, user_message, template_id):
    to_email = 'shelyuu@gmail.com'  # Replace with your email
    subject = 'New message from FISH'

    email_content = get_template_content(template_id, user_name, user_company, user_phone, user_message, user_email)

    # Set up the MIME
    message = MIMEMultipart()
    message['From'] = 'shelyuu.com'
    message['To'] = to_email
    message['Subject'] = subject

    # Attach the message to the email
    message.attach(MIMEText(email_content, 'plain'))

    # Connect to the SMTP server
    with smtplib.SMTP('your_smtp_server.com', 587) as server:  # Replace with your SMTP server details
        server.starttls()
        server.login('your_email@gmail.com', 'your_email_password')  # Replace with your email credentials
        server.sendmail('your_email@gmail.com', to_email, message.as_string())
