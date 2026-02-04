#!/usr/bin/env python3
"""
Hinge Automation Bot
--------------------
Make sure to fill in your credentials in .env first!

To get credentials, you need to intercept Hinge's network traffic:
1. Use HTTP Toolkit or Charles Proxy on your phone
2. Look at requests to prod-api.hingeaws.net
3. Extract: authorization header (Bearer token), x-session-id, and user ID from response
"""

import os
import json
from dotenv import load_dotenv

load_dotenv()

from hingesdk.api import HingeAPIClient
from hingesdk.media import HingeMediaClient
from hingesdk.tools import HingeTools

# Load credentials from .env
AUTH_TOKEN = os.getenv("BEARER_TOKEN")
SESSION_ID = os.getenv("SESSION_ID")
USER_ID = os.getenv("USER_ID")
DEVICE_ID = os.getenv("DEVICE_ID")
INSTALL_ID = os.getenv("INSTALL_ID")


def check_credentials():
    """Verify credentials are set"""
    if not AUTH_TOKEN or AUTH_TOKEN == "YOUR_BEARER_TOKEN_HERE":
        print("❌ BEARER_TOKEN not set in .env")
        return False
    if not SESSION_ID or SESSION_ID == "YOUR_SESSION_ID_HERE":
        print("❌ SESSION_ID not set in .env")
        return False
    if not USER_ID or USER_ID == "YOUR_USER_ID_HERE":
        print("❌ USER_ID not set in .env")
        return False
    print("✅ Credentials loaded")
    return True


def get_clients():
    """Initialize API and Media clients"""
    api_client = HingeAPIClient(
        auth_token=AUTH_TOKEN,
        session_id=SESSION_ID,
        user_id=USER_ID,
        device_id=DEVICE_ID,
        install_id=INSTALL_ID,
        platform="iOS"
    )
    media_client = HingeMediaClient(auth_token=AUTH_TOKEN)
    tools = HingeTools(api_client, media_client)
    return api_client, media_client, tools


def fetch_recommendations():
    """Fetch and display current recommendations"""
    api_client, media_client, tools = get_clients()
    
    print("\n📱 Fetching recommendations...")
    recs = api_client.get_recommendations()
    print(f"✅ Got recommendations response")
    return recs


def save_profiles_to_json(output_file="profiles.json"):
    """Save all profile data to a JSON file"""
    api_client, media_client, tools = get_clients()
    
    print(f"\n💾 Saving profiles to {output_file}...")
    tools.create_profile_json(output_file=output_file)
    print(f"✅ Profiles saved to {output_file}")


def like_profile(subject_id, rating_token, comment="", content_id=None, question_id=None):
    """
    Like a profile with an optional comment
    
    Args:
        subject_id: The user's subject ID
        rating_token: The rating token for the interaction
        comment: Your comment/message
        content_id: Photo content ID (if liking a photo)
        question_id: Question ID (if liking a prompt response)
    """
    api_client, _, _ = get_clients()
    
    if question_id:
        # Like a prompt response
        response = api_client.like_profile(
            subject_id=subject_id,
            rating_token=rating_token,
            prompt={
                "questionId": question_id,
                "response": comment
            }
        )
    elif content_id:
        # Like a photo
        response = api_client.like_profile(
            subject_id=subject_id,
            rating_token=rating_token,
            photo={
                "contentId": content_id,
                "comment": comment
            }
        )
    else:
        print("❌ Need either content_id (photo) or question_id (prompt)")
        return None
    
    print(f"✅ Liked profile!")
    return response


def mass_scrape(iterations=10, min_sleep=20, max_sleep=60):
    """
    Scrape multiple pages of recommendations
    
    Args:
        iterations: Number of pages to scrape (max ~40 before rate limiting)
        min_sleep: Minimum seconds between requests
        max_sleep: Maximum seconds between requests
    """
    api_client, media_client, tools = get_clients()
    
    print(f"\n🔄 Scraping {iterations} pages of recommendations...")
    print(f"   (sleeping {min_sleep}-{max_sleep}s between requests)")
    
    tools.scrape_recommendations_multiple(
        iterations=iterations,
        min_sleep=min_sleep,
        max_sleep=max_sleep,
    )
    print("✅ Scraping complete! Check all_recommendations.json")


def download_images(output_path="images"):
    """Download all images from recommendations"""
    api_client, media_client, tools = get_clients()
    
    print(f"\n📸 Downloading images to {output_path}/...")
    tools.download_recommendation_content(output_path=output_path)
    print(f"✅ Images downloaded!")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("=" * 50)
    print("🔥 Hinge Automation Bot")
    print("=" * 50)
    
    if not check_credentials():
        print("\n⚠️  Please fill in your credentials in .env file")
        print("   See README for instructions on getting credentials")
        exit(1)
    
    # Uncomment what you want to do:
    
    # 1. Fetch recommendations
    # recs = fetch_recommendations()
    # print(json.dumps(recs, indent=2))
    
    # 2. Save profiles to JSON
    # save_profiles_to_json("profiles.json")
    
    # 3. Mass scrape (be careful with rate limits!)
    # mass_scrape(iterations=5, min_sleep=30, max_sleep=60)
    
    # 4. Download images
    # download_images("images")
    
    print("\n👆 Uncomment functions in main.py to run them!")
