#!/usr/bin/env python3
"""
Hinge Bot API Backend
---------------------
FastAPI server that wraps the HingeSDK for the web frontend.

Run with: uvicorn api:app --reload --port 8080
"""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from hingesdk.api import HingeAPIClient
from hingesdk.media import HingeMediaClient
from hingesdk.tools import HingeTools

app = FastAPI(title="Hinge Bot API", version="1.0.0")

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
def get_client():
    return HingeAPIClient(
        auth_token=os.getenv("BEARER_TOKEN"),
        session_id=os.getenv("SESSION_ID"),
        user_id=os.getenv("USER_ID"),
        device_id=os.getenv("DEVICE_ID"),
        install_id=os.getenv("INSTALL_ID"),
        platform="iOS"
    )


class LikeRequest(BaseModel):
    subject_id: str
    rating_token: str
    comment: Optional[str] = ""
    content_id: Optional[str] = None  # For liking photos
    question_id: Optional[str] = None  # For liking prompts


class SkipRequest(BaseModel):
    subject_id: str
    rating_token: str


@app.get("/")
def root():
    return {"status": "ok", "message": "Hinge Bot API is running"}


@app.get("/api/recommendations")
def get_recommendations():
    """Get current recommendations/feed with profile data"""
    try:
        client = get_client()
        recs = client.get_recommendations()
        
        # Extract subjects from the first feed
        feeds = recs.get("feeds", [])
        if not feeds:
            return {"success": True, "count": 0, "subjects": []}
        
        subjects = feeds[0].get("subjects", [])
        if not subjects:
            return {"success": True, "count": 0, "subjects": []}
        
        # Fetch detailed profiles for all subjects
        subject_ids = [s["subjectId"] for s in subjects]
        try:
            profiles_data = client.get_public_users(subject_ids)
            # Response is an array of user objects with identityId
            users = {}
            if isinstance(profiles_data, list):
                users = {u.get("identityId"): u for u in profiles_data}
            elif isinstance(profiles_data, dict) and "users" in profiles_data:
                users = {u.get("identityId") or u.get("id"): u for u in profiles_data.get("users", [])}
            
            # Merge profile data into subjects
            enriched = []
            for subj in subjects:
                profile = users.get(subj["subjectId"], {})
                enriched.append({
                    **subj,
                    "profile": profile
                })
            
            return {
                "success": True,
                "count": len(enriched),
                "subjects": enriched
            }
        except Exception as e:
            # If profile fetch fails, return basic subjects
            print(f"Failed to fetch profiles: {e}")
            return {
                "success": True,
                "count": len(subjects),
                "subjects": subjects
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/profile/{subject_id}")
def get_profile(subject_id: str):
    """Get detailed profile for a subject"""
    try:
        client = get_client()
        # Use get_public_users to fetch profile data
        data = client.get_public_users([subject_id])
        users = data.get("users", [])
        if users:
            return {"success": True, "profile": users[0]}
        return {"success": False, "profile": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/like")
def like_profile(req: LikeRequest):
    """Like a profile (photo or prompt)"""
    try:
        client = get_client()
        
        if req.question_id:
            # Like a prompt
            response = client.like_profile(
                subject_id=req.subject_id,
                rating_token=req.rating_token,
                prompt={
                    "questionId": req.question_id,
                    "response": req.comment or ""
                }
            )
        elif req.content_id:
            # Like a photo
            response = client.like_profile(
                subject_id=req.subject_id,
                rating_token=req.rating_token,
                photo={
                    "contentId": req.content_id,
                    "comment": req.comment or ""
                }
            )
        else:
            raise HTTPException(status_code=400, detail="Need either content_id or question_id")
        
        return {"success": True, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/skip")
def skip_profile(req: SkipRequest):
    """Skip/pass on a profile - just moves to next locally"""
    # The SDK doesn't have a skip method, but that's fine
    # Skipping just means we don't like them and move on
    return {"success": True, "message": "Skipped locally"}


@app.get("/api/me")
def get_my_profile():
    """Get your own profile as others see it"""
    try:
        client = get_client()
        user_id = os.getenv("USER_ID")
        data = client.get_public_users([user_id])
        
        # Handle different response formats
        if isinstance(data, list) and len(data) > 0:
            profile = data[0]
        elif isinstance(data, dict):
            users = data.get("users", data.get("profiles", []))
            profile = users[0] if users else data
        else:
            profile = {}
        
        return {"success": True, "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/account")
def get_account():
    """Get account/subscription info"""
    try:
        client = get_client()
        account = client.get_account_info()
        return {"success": True, "account": account}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/traits")
def get_traits():
    """Get your preferences/dealbreakers"""
    try:
        client = get_client()
        traits = client.get_user_traits()
        return {"success": True, "traits": traits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/settings")
def get_settings():
    """Get your settings"""
    try:
        client = get_client()
        settings = client.get_settings()
        return {"success": True, "settings": settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/standouts")
def get_standouts():
    """Get people who liked you (standouts)"""
    try:
        client = get_client()
        data = client.get_standouts()
        standouts = data.get("free", [])
        return {"success": True, "standouts": standouts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/like-limit")
def get_like_limit():
    """Get remaining likes for today"""
    try:
        client = get_client()
        limit = client.get_like_limit()
        return {"success": True, "limit": limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health_check():
    """Check if API and credentials are working"""
    try:
        client = get_client()
        # Try a simple API call
        recs = client.get_recommendations()
        return {
            "status": "healthy",
            "user_id": os.getenv("USER_ID"),
            "api_working": True
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "api_working": False
        }


@app.post("/api/save-profiles")
async def save_profiles(request: Request):
    """Save profiles to local JSON file"""
    import json
    from pathlib import Path
    
    profiles = await request.json()
    
    save_path = Path("saved_profiles.json")
    
    # Load existing profiles
    existing = []
    if save_path.exists():
        try:
            with open(save_path, "r") as f:
                existing = json.load(f)
        except:
            existing = []
    
    # Deduplicate by subjectId
    existing_ids = {p.get("subjectId") for p in existing}
    new_profiles = [p for p in profiles if p.get("subjectId") not in existing_ids]
    
    # Append new profiles
    combined = existing + new_profiles
    
    with open(save_path, "w") as f:
        json.dump(combined, f, indent=2)
    
    return {
        "success": True, 
        "saved": len(new_profiles), 
        "total": len(combined),
        "skipped": len(profiles) - len(new_profiles)
    }


@app.get("/api/saved-profiles")
def get_saved_profiles():
    """Get all saved profiles from local JSON file"""
    import json
    from pathlib import Path
    
    save_path = Path("saved_profiles.json")
    
    if not save_path.exists():
        return {"success": True, "profiles": [], "count": 0}
    
    try:
        with open(save_path, "r") as f:
            profiles = json.load(f)
        return {"success": True, "profiles": profiles, "count": len(profiles)}
    except Exception as e:
        return {"success": False, "error": str(e), "profiles": [], "count": 0}


@app.delete("/api/saved-profiles")
def clear_saved_profiles():
    """Clear all saved profiles"""
    from pathlib import Path
    
    save_path = Path("saved_profiles.json")
    if save_path.exists():
        save_path.unlink()
    
    return {"success": True, "message": "Cleared all saved profiles"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
