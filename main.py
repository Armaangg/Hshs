import requests
import instaloader
from flask import Flask, jsonify, request

# Replace with your actual session ID (keep this private)
INSTAGRAM_SESSIONID = "73175687525%3AuX22BAmYVZJPSI%3A0%3AAYesW-_mKKB8jwlyC_cZ6DmmJTNPXsrH8AkWPORhWA"

# Replace with your ImgBB API key
IMGBB_API_KEY = "dc924fb2a0c50c7fcff97ebe261d51e7"

app = Flask(__name__)

def get_instagram_info(username):
    """Fetch Instagram profile data using a session ID."""
    print(f"[INFO] Fetching Instagram profile for username: {username}")
    
    try:
        # Using instaloader to fetch the profile data
        L = instaloader.Instaloader()
        L.context._session.cookies.set("sessionid", INSTAGRAM_SESSIONID)
        profile = instaloader.Profile.from_username(L.context, username)
        
        print(f"[SUCCESS] Fetched profile for: {username}")
        return {
            "username": profile.username,
            "full_name": profile.full_name,
            "is_private": profile.is_private,
            "is_verified": profile.is_verified,
            "profile_pic_url": profile.profile_pic_url,
            "biography": profile.biography,
            "followers": profile.followers,
            "followees": profile.followees,
            "mediacount": profile.mediacount
        }
    except Exception as e:
        print(f"[ERROR] Failed to retrieve profile data: {str(e)}")
        return {"error": f"Failed to retrieve profile data: {str(e)}"}

def get_profile_screenshot(username):
    """Take a screenshot of the profile page and upload to ImgBB."""
    print(f"[INFO] Uploading full profile screenshot to ImgBB for: {username}")
    
    try:
        # Get profile info to get the profile picture URL
        profile_data = get_instagram_info(username)
        if "error" in profile_data:
            print(f"[ERROR] Cannot capture screenshot due to profile fetch error: {profile_data['error']}")
            return {"error": profile_data["error"]}

        # In this case, we simulate a screenshot URL for demonstration purposes
        # In a real-world scenario, you could use tools like Selenium or an API to take a screenshot.
        # Here we simply return the profile picture URL as a placeholder.
        # Example: Use a headless browser (e.g., Selenium) to capture a full-profile screenshot.

        # For now, we will simulate the screenshot with the profile's picture
        profile_pic_url = profile_data["profile_pic_url"]
        
        # Upload to ImgBB (this is just the profile picture URL for now)
        print(f"[INFO] Uploading screenshot to ImgBB...")
        img_bb_response = requests.post(
            "https://api.imgbb.com/1/upload",
            params={"key": IMGBB_API_KEY},
            files={"image": requests.get(profile_pic_url).content}
        )
        img_bb_data = img_bb_response.json()

        if img_bb_response.status_code == 200:
            print(f"[SUCCESS] Screenshot uploaded: {img_bb_data['data']['url']}")
            return {"ss_url": img_bb_data["data"]["url"]}
        else:
            print("[ERROR] Failed to upload profile screenshot")
            return {"error": "Failed to upload profile screenshot"}

    except Exception as e:
        print(f"[ERROR] Failed to capture screenshot: {str(e)}")
        return {"error": f"Failed to capture screenshot: {str(e)}"}

@app.route('/instagram-profile', methods=['GET'])
def fetch_instagram_profile():
    """Fetch Instagram profile data along with profile picture and screenshot URLs."""
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Missing username parameter"}), 400
    
    print(f"[INFO] Processing request for username: {username}")

    # Get Instagram profile data
    data = get_instagram_info(username)
    if "error" in data:
        return jsonify(data), 400
    
    # Get profile screenshot URL
    ss_data = get_profile_screenshot(username)
    if "error" in ss_data:
        return jsonify(ss_data), 400

    data["ss_url"] = ss_data["ss_url"]

    print(f"[INFO] Returning final response for {username}")
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True, port=8080)
      
