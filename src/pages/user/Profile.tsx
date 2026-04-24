import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { User, Camera } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, token } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL?.endsWith('/api') ? (import.meta as any).env?.VITE_API_URL : `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'}/api`);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      const storedToken = token || (localStorage.getItem('quickeats_auth') ? JSON.parse(localStorage.getItem('quickeats_auth') as string).token : null);
      if (!storedToken) return alert('Not authenticated');

      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${storedToken}` }
      });

      if (!res.ok) {
        let errMsg = 'Failed to delete account';
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const err = await res.json();
            errMsg = err.message || errMsg;
          } else {
            const text = await res.text();
            errMsg = text || errMsg;
          }
        } catch (e) {
          console.error('Error parsing delete response', e);
        }
        return alert(errMsg);
      }

      // Clear local storage and redirect to login
      localStorage.removeItem('quickeats_auth');
      alert('Your account has been deleted. You will not be able to login until recovery is approved.');
      window.location.href = '/auth';
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePicture(base64String);
        setProfilePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const storedToken = token || (localStorage.getItem('quickeats_auth') ? JSON.parse(localStorage.getItem('quickeats_auth') as string).token : null);
      if (!storedToken) {
        setIsLoading(false);
        return alert('Not authenticated');
      }

      const body: any = { name, email, phone };
      if (profilePicture) {
        body.profilePicture = profilePicture;
      }

      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errMsg = 'Failed to update profile';
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const err = await res.json();
            errMsg = err.message || errMsg;
          } else {
            const text = await res.text();
            errMsg = text || errMsg;
          }
        } catch (e) {
          console.error('Error parsing update response', e);
        }
        return alert(errMsg);
      }

      // parse updated user safely
      let updated: any = null;
      try {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          updated = await res.json();
        } else {
          const text = await res.text();
          console.warn('Update returned non-json:', text);
          // nothing to update
        }
      } catch (e) {
        console.error('Error parsing update response', e);
      }
      // Update stored auth user
      try {
        const stored = localStorage.getItem('quickeats_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.user = updated;
          localStorage.setItem('quickeats_auth', JSON.stringify(parsed));
        }
      } catch { }

      alert('Profile updated');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Address UI removed per request

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary border-2 border-border flex items-center justify-center">
                {user.profilePicture || profilePreview ? (
                  <img
                    src={profilePreview || user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="picture-upload"
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="picture-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              Click the camera icon to update your photo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role (Read Only)</Label>
              <Input id="role" value={user.role} readOnly />
            </div>
          </div>
          <Button onClick={handleUpdateProfile} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Address section removed as requested */}

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Change Email removed as requested */}
          <Button variant="outline" onClick={handleDeleteAccount} className="w-full justify-start text-red-600 hover:text-red-700">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
