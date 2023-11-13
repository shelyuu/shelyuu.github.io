import csv

# Load email templates from CSV file into a dictionary
def load_email_templates():
    templates = {}
    with open('email_templates.csv', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            templates[row['template_id']] = row['template_content']
    return templates

# Retrieve template content based on template_id
def get_template_content(template_id, user_name, user_company, user_phone, user_message, user_email):
    templates = load_email_templates()
    template_content = templates.get(template_id, '')
    return template_content.format(
        user_name=user_name,
        user_company=user_company,
        user_phone=user_phone,
        user_message=user_message,
        user_email=user_email
    )