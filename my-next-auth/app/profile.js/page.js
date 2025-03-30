'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  // Mock user data (would come from your auth system/database)
  const [userData, setUserData] = useState({
    name: 'Jane Hacker',
    email: 'jane.hacker@example.com',
    school: 'Penn State University',
    major: 'Computer Science',
    graduationYear: '2026',
    skills: ['JavaScript', 'React', 'Node.js', 'UI/UX Design'],
    bio: 'Passionate developer with experience in web and mobile applications. Looking to collaborate on innovative projects!',
    discord: 'janehacker#1234',
    github: 'janehacker',
    teamStatus: 'Looking for a team'
  });

  // State for editing mode
  const [isEditing, setIsEditing] = useState(false);
  // State for form data while editing
  const [formData, setFormData] = useState(userData);
  // State for new skill input
  const [newSkill, setNewSkill] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Update user data (in a real app, this would be saved to a database)
    setUserData(formData);
    setIsEditing(false);
    alert('Profile updated successfully! In a real app, this would be saved to a database.');
  };

  // Handle adding a new skill
  const handleAddSkill = () => {
    if (newSkill.trim() !== '') {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  // Handle removing a skill
  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  return (
    <main className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="bg-[#3b82f6] rounded-xl p-8 mb-12 shadow-xl text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#f59e0b] mb-4">YOUR PROFILE</h1>
        <p className="text-xl text-[#fef3c7] mb-4">Manage your HackPSU participant information</p>
      </div>

      {/* Profile Content */}
      <div className="ticket-shape max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#b91c1c]">Hacker Profile</h2>
          {!isEditing ? (
            <button 
              className="carnival-button text-lg py-2"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <button 
              className="bg-gray-500 text-white py-2 px-4 rounded-lg text-lg"
              onClick={() => {
                setIsEditing(false);
                setFormData(userData); // Reset form data if cancel
              }}
            >
              Cancel
            </button>
          )}
        </div>

        {!isEditing ? (
          // Display Mode
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xl font-semibold text-[#b91c1c]">Personal Info</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Name:</span> {userData.name}</p>
                  <p><span className="font-medium">Email:</span> {userData.email}</p>
                  <p><span className="font-medium">School:</span> {userData.school}</p>
                  <p><span className="font-medium">Major:</span> {userData.major}</p>
                  <p><span className="font-medium">Graduation Year:</span> {userData.graduationYear}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-[#b91c1c]">Hackathon Status</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Team Status:</span> {userData.teamStatus}</p>
                  <p><span className="font-medium">Discord:</span> {userData.discord}</p>
                  <p><span className="font-medium">GitHub:</span> {userData.github}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[#b91c1c]">Bio</h3>
              <p className="mt-2">{userData.bio}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[#b91c1c]">Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {userData.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="bg-[#f59e0b] text-[#b91c1c] px-3 py-1 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <Link href="/" className="text-[#b91c1c] hover:underline">Back to Home</Link>
              <Link href="/group-finder" className="carnival-button text-lg py-2">Find a Team</Link>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xl font-semibold text-[#b91c1c] mb-3">Personal Info</h3>
                
                <div className="mb-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className="form-input"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="form-input"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">School</label>
                  <input 
                    type="text" 
                    id="school" 
                    name="school" 
                    value={formData.school} 
                    onChange={handleChange} 
                    className="form-input"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                  <input 
                    type="text" 
                    id="major" 
                    name="major" 
                    value={formData.major} 
                    onChange={handleChange} 
                    className="form-input"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                  <input 
                    type="text" 
                    id="graduationYear" 
                    name="graduationYear" 
                    value={formData.graduationYear} 
                    onChange={handleChange} 
                    className="form-input"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-[#b91c1c] mb-3">Hackathon Status</h3>
                
                <div className="mb-3">
                  <label htmlFor="teamStatus" className="block text-sm font-medium text-gray-700 mb-1">Team Status</label>
                  <select 
                    id="teamStatus" 
                    name="teamStatus" 
                    value={formData.teamStatus} 
                    onChange={handleChange} 
                    className="form-select"
                  >
                    <option value="Looking for a team">Looking for a team</option>
                    <option value="Have a team">Have a team</option>
                    <option value="Open to joining a team">Open to joining a team</option>
                    <option value="Prefer to work alone">Prefer to work alone</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="discord" className="block text-sm font-medium text-gray-700 mb-1">Discord Username</label>
                  <input 
                    type="text" 
                    id="discord" 
                    name="discord" 
                    value={formData.discord} 
                    onChange={handleChange} 
                    className="form-input"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">GitHub Username</label>
                  <input 
                    type="text" 
                    id="github" 
                    name="github" 
                    value={formData.github} 
                    onChange={handleChange} 
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-xl font-semibold text-[#b91c1c] mb-1">Bio</label>
              <textarea 
                id="bio" 
                name="bio" 
                rows="3" 
                value={formData.bio} 
                onChange={handleChange} 
                className="form-textarea"
              ></textarea>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[#b91c1c] mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="bg-[#f59e0b] text-[#b91c1c] px-3 py-1 rounded-full font-medium flex items-center">
                    {skill}
                    <button 
                      type="button"
                      className="ml-2 text-[#b91c1c] hover:text-red-800 focus:outline-none"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Add a skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="form-input"
                />
                <button 
                  type="button"
                  className="bg-[#f59e0b] text-[#b91c1c] py-1 px-4 rounded-lg font-medium"
                  onClick={handleAddSkill}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button 
                type="submit" 
                className="carnival-button text-lg py-2"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}