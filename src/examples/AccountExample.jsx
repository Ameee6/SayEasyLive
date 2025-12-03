// src/examples/AccountExample.jsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getUserTier, TIER_LIMITS } from '../tierManager';

export default function AccountExample(){
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      setUser(u);
      if(u){
        const snap = await getDoc(doc(db,'users',u.uid));
        setProfile(snap.exists()?snap.data():null);
      } else setProfile(null);
    });
    return unsub;
  },[]);

  if(!user) return <div>Please sign in</div>;

  const tierInfo = getUserTier(profile);
  const tierDetails = TIER_LIMITS[tierInfo.tier];

  return (
    <div style={{maxWidth: 500, margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px'}}>
      <h3>Account</h3>
      <div style={{marginBottom: 16}}>
        <strong>Email:</strong> {user.email}
      </div>
      <div style={{marginBottom: 16}}>
        <strong>Name:</strong> {profile?.fullName || 'Not set'}
      </div>

      <div style={{
        marginTop: 20,
        padding: 16,
        background: tierInfo.tier === 'founding' ? '#fff4e6' : tierInfo.tier === 'premium' ? '#e6f7ff' : '#f5f5f5',
        borderRadius: 8,
        border: '2px solid',
        borderColor: tierInfo.tier === 'founding' ? '#ffa940' : tierInfo.tier === 'premium' ? '#1890ff' : '#d9d9d9'
      }}>
        <h4 style={{marginTop: 0}}>
          {tierDetails.displayName}
          {tierInfo.tier === 'founding' && ' 🌟'}
        </h4>
        <p style={{color: '#666', fontSize: 14}}>{tierDetails.description}</p>
        <div style={{marginTop: 12}}>
          <strong>Features:</strong>
          <ul style={{marginTop: 8, paddingLeft: 20}}>
            {tierDetails.features.map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
        </div>
        <div style={{marginTop: 12, fontSize: 14}}>
          <strong>Custom buttons:</strong> {tierInfo.customButtonLimit} / 10
        </div>
        {profile?.grantedByAdmin && (
          <div style={{marginTop: 12, padding: 8, background: 'rgba(255,255,255,0.7)', borderRadius: 4, fontSize: 12}}>
            ✨ Special access granted by admin
          </div>
        )}
      </div>

      {tierInfo.tier === 'free' && (
        <div style={{marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 8}}>
          <p style={{margin: 0, fontSize: 14}}>
            Want to customize all 10 buttons? <a href="#upgrade" style={{color: '#1890ff'}}>Upgrade to Premium</a> for $12.99/year
          </p>
        </div>
      )}

      <button
        onClick={()=>fbSignOut(auth)}
        style={{marginTop: 20, padding: '10px 20px', cursor: 'pointer'}}
      >
        Sign out
      </button>
    </div>
  );
}
