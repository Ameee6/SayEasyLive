// src/examples/SignInExample.jsx
import React, { useState } from 'react';
import { signUp, signInWithPassword, signInWithGoogle } from '../auth';

export default function SignInExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSignUp(e) {
    e.preventDefault();
    try {
      await signUp(email, password);
      setMessage('Signed up — check your profile.');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    try {
      await signInWithPassword(email, password);
      setMessage('Signed in');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle();
      setMessage('Signed in with Google');
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div style={{maxWidth:420, margin:'0 auto'}}>
      <h3>Sign in / Sign up</h3>
      <form onSubmit={handleSignIn}>
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <div style={{display:'flex', gap:8}}>
          <button onClick={handleSignUp}>Sign Up</button>
          <button type="submit">Sign In</button>
        </div>
      </form>
      <div style={{marginTop:12}}>
        <button onClick={handleGoogle}>Sign in with Google</button>
      </div>
      <div style={{marginTop:12, color:'red'}}>{message}</div>
    </div>
  );
}
