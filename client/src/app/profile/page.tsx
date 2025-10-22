'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/Toast';

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    department: '',
    bio: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      const user = JSON.parse(userData);
      setUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        phone: user.phone || '',
        department: user.department || '',
        bio: user.bio || ''
      });
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    showToast('Profile updated successfully!', 'success');
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || '',
      phone: user?.phone || '',
      department: user?.department || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture & Basic Info */}
          <div className="lg:col-span-1">
            <Card title="Profile Picture" variant="elevated">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mb-4"
                  onClick={() => showToast('Profile picture upload coming soon!', 'info')}
                >
                  Change Photo
                </Button>
                <div className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max size 2MB.
                </div>
              </div>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card 
              title="Personal Information" 
              variant="elevated"
              action={
                !isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                  </div>
                )
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  variant={isEditing ? 'default' : 'filled'}
                />
                
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  variant={isEditing ? 'default' : 'filled'}
                />
                
                <Input
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  variant={isEditing ? 'default' : 'filled'}
                />
                
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  variant={isEditing ? 'default' : 'filled'}
                />
                
                <Input
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  variant={isEditing ? 'default' : 'filled'}
                />
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isEditing
                        ? 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                        : 'bg-muted border-muted'
                    }`}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </Card>

            {/* Account Information */}
            <Card title="Account Information" variant="elevated" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Member Since
                  </label>
                  <div className="px-4 py-3 bg-muted rounded-lg text-muted-foreground">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Last Login
                  </label>
                  <div className="px-4 py-3 bg-muted rounded-lg text-muted-foreground">
                    {new Date(user.lastLogin || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}








