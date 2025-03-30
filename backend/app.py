from flask import Flask, request, render_template, jsonify
import pdfplumber
import docx
import os
import google.generativeai as genai  # Import the Gemini API library
import psycopg2
import random
from supabase import create_client


app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Configure the Gemini API key (ideally from an environment variable)
api_key = os.getenv("api_key")  # Fetch API key from environment variable
genai.configure(api_key=api_key)






def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(docx_path):
    doc = docx.Document(docx_path)
    return "\n".join([para.text for para in doc.paragraphs])

def list_available_models():
    try:
        models = genai.list_models()
        available_models = []
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                available_models.append(model.name)
        return {"available_models": available_models}
    except Exception as e:
        return {"error": f"Error listing models: {e}"}

def get_ai_response(text):
    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')  
        prompt = f"From the following resume text, extract only the key skills, technologies, and relevant experience keywords. Provide these as a simple, unnumbered list where each item starts with an asterisk (*), followed by a space, and the keyword is in bold markdown format (enclosed in double asterisks). Each item should be on a new line. Do not include any additional explanations or advice: \n\n{text}"
        response = model.generate_content(prompt)
        return {"response": response.text}  # Return the extracted text
    except Exception as e:
        return {"error": f"Error calling Gemini API: {e}"}

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join(app.config["UPLOAD_FOLDER"], str(file.filename))
    file.save(file_path)

    if file.filename and file.filename.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(file_path)
    elif file.filename and file.filename.endswith(".docx"):
        extracted_text = extract_text_from_docx(file_path)
    else:
        return jsonify({"error": "Unsupported file format"}), 400

    # Get AI response
    ai_response = get_ai_response(extracted_text)

    # Return the AI response
    return jsonify({"extracted_info": ai_response})

@app.route("/models", methods=["GET"])
def available_models():
    models_info = list_available_models()
    return jsonify(models_info)




def getSupabaseData(team_id):



    NEXT_PUBLIC_SUPABASE_URL = "https://nqcbnwekqmurbwbkqnev.supabase.co/"
    NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xY2Jud2VrcW11cmJ3YmtxbmV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzI3NDAzNywiZXhwIjoyMDU4ODUwMDM3fQ.bgImHADnxwTmLzz4IUGSvmBJoWcEsn2p_sHFuQSR_tU"


    supabase = create_client(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    response = supabase.table("Member").select("*").execute()
    member_data = response.data

    response = supabase.table("Team").select("*").execute()
    team_data = response.data

    response = supabase.table("User").select("*").execute()
    user_data = response.data

    response = supabase.table("Beacons").select("*").execute()
    beacon_data = response.data


    for team in team_data:
        if team["team_id"] != team_id:
            continue
        scores = {}
        for member in member_data:

            score = 0
            
            if not member['wants_team'] or member['team_id']:
                continue
            
            # MATCHING ALGO
            # ------------------------------
            print(user_data, member['user_id'])
            
            user = None
            for u in user_data:
                if u["user_id"] == member['user_id']:
                    user = u
            
            
            
            for beacon in beacon_data:
                if beacon['team_id'] == team_id:
                    for role in beacon['role_ids']: 
                        if role in user['role_ids'].split(','):
                            score += 1

            scores[member['user_id']] = score

            # ------------------------------


        print(scores)
        # sort and assign to team
        return sorted(scores, key=scores.get)[-1:-min(len(scores),3)-1:-1]
    else:
        print('Error: Team',team_id,'not found')
        return None
    

if __name__ == "__main__":
    
    print(getSupabaseData(4))
    app.run(debug=True)
