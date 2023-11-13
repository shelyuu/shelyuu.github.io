from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/sendmessage', methods=['POST'])
def send_email_api():
    try:
        post_data = request.form

        # Retrieve the template_id from the form data
        template_id = post_data.get("template_id", "")
        
        # Your existing code for processing the form data goes here

        # Example response:
        response = {'type': 'message', 'text': 'Your message has been sent, we will get back to you asap!'}
        return jsonify(response), 200
    except Exception as e:
        response = {'type': 'error', 'text': f'Oops! Something went wrong: {str(e)}'}
        return jsonify(response), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)  # Replace with your desired host and port
