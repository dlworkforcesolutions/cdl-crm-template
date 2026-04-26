import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState("");

  // ✅ FIXED useEffect (no more checkUser issue)
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        fetchContacts(data.user.id);
      }
    }

    loadUser();
  }, []);

  async function signUp() {
    await supabase.auth.signUp({ email, password });
    alert("Check your email to confirm signup");
  }

async function signIn() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  setUser(data.user);

  if (data.user) {
    fetchContacts(data.user.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function fetchContacts(userId) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId);

    setContacts(data || []);
  }

  async function addContact() {
    await supabase.from("contacts").insert([
      {
        name,
        user_id: user.id,
      },
    ]);

    setName("");
    fetchContacts(user.id);
  }

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <br /><br />

        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <br /><br />

        <button onClick={signIn}>Sign In</button>
        <button onClick={signUp}>Sign Up</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>CRM</h2>

      <button onClick={signOut}>Logout</button>

      <h3>Add Contact</h3>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={addContact}>Add</button>

      <h3>Your Contacts</h3>

      <ul>
        {contacts.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
