import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const Login = ({ onLogin, supabase }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) console.warn("Profile fetch warning:", profileError);

      onLogin({
        user: data.user,
        role: profile?.role || 'field_officer'
      });

      toast.success('Login successful!');
    } catch (err) {
      toast.error(err.code || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl p-8 w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white">Land Vault</h1>
          <p className="text-slate-400 mt-2">Homestead Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-semibold disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Demo:<br />
          Admin: admin@landvault.co / admin123<br />
          Officer: officer@landvault.co / officer123
        </div>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
};

export default Login;