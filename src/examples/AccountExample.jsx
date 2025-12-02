// src/examples/AccountExample.jsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
  return (
    <div>
      <h3>Account</h3>
      <div>Email: {user.email}</div>
      <div>Name: {profile?.fullName}</div>
      <button onClick={()=>fbSignOut(auth)}>Sign out</button>
    </div>
  );
}
