'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GroupFinderPage() {
  // State for form data
  const [teamName, setTeamName] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [skills, setSkills] = useState({
    frontend: false,
    backend: false,
    ml: false,
    design: false,
    mobile: false,
    other: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkill, setFilterSkill] = useState('');

  // Sample team data
  const sampleTeams = [
    {
      id: 1,
      name: "Web Wizards",
      lookingFor: "Frontend Developer, UI Designer",
      projectIdea: "An interactive campus map with event tracking",
    },
    {
      id: 2,
      name: "Data Miners",
      lookingFor: "Machine Learning Engineer, Backend Developer",
      projectIdea: "Predictive analytics for student schedules",
    },
    {
      id: 3,
      name: "Mobile Mavericks",
      lookingFor: "iOS Developer, Backend Engineer",
      projectIdea: "Food delivery optimization app for campus",
    }
  ];

  // Handle form submission
  const handleCreateTeam = (e) => {
    e.preventDefault();
    // Here you would connect to your backend/database
    alert(`Team ${teamName} created! In a real app, this would be saved to a database.`);
    // Reset form
    setTeamName('');
    setProjectIdea('');
    setSkills({
      frontend: false,
      backend: false,
      ml: false,
      design: false,
      mobile: false,
      other: false
    });
  };

  // Handle skill checkbox changes
  const handleSkillChange = (e) => {
    setSkills({
      ...skills,
      [e.target.id]: e.target.checked
    });
  };

  return (
    <main className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="bg-[#3b82f6] rounded-xl p-8 mb-12 shadow-xl text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#f59e0b] mb-4">TEAM FINDER</h1>
        <p className="text-xl text-[#fef3c7] mb-4">Find your perfect hackathon team or create your own!</p>
      </div>

      {/* Team Finding Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Find a Team */}
        <div className="ticket-shape">
          <h2 className="text-3xl font-bold text-[#b91c1c] mb-6 text-center">Find a Team</h2>
          
          <div className="mb-6">
            <label htmlFor="search" className="block text-lg font-medium text-gray-700 mb-2">Search Teams</label>
            <input 
              type="text" 
              id="search" 
              placeholder="Search by skills, project idea, or name" 
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="filterSkills" className="block text-lg font-medium text-gray-700 mb-2">Filter by Skills Needed</label>
            <select 
              id="filterSkills" 
              className="form-select"
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
            >
              <option value="">All Skills</option>
              <option value="frontend">Frontend Development</option>
              <option value="backend">Backend Development</option>
              <option value="ml">Machine Learning</option>
              <option value="design">UI/UX Design</option>
              <option value="mobile">Mobile Development</option>
            </select>
          </div>
          
          <button 
            className="carnival-button w-full"
            onClick={() => alert("Search functionality would connect to a database in a real implementation")}
          >
            Search Teams
          </button>
          
          {/* Team List (Sample) */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-[#b91c1c] mb-4">Available Teams</h3>
            
            <div className="space-y-4" id="teamList">
              {sampleTeams.map((team) => (
                <div key={team.id} className="bg-[#fef3c7] p-4 rounded-lg border-2 border-[#f59e0b]">
                  <h4 className="text-lg font-bold text-[#b91c1c]">{team.name}</h4>
                  <p className="text-sm mb-2">Looking for: {team.lookingFor}</p>
                  <p className="text-sm mb-2">Project Idea: {team.projectIdea}</p>
                  <button 
                    className="bg-[#b91c1c] text-white py-1 px-3 rounded text-sm hover:bg-red-700 transition"
                    onClick={() => alert(`Contact request sent to ${team.name}. In a real app, this would connect you with the team.`)}
                  >
                    Contact Team
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Create a Team */}
        <div className="ticket-shape">
          <h2 className="text-3xl font-bold text-[#b91c1c] mb-6 text-center">Create a Team</h2>
          
          <form id="createTeamForm" onSubmit={handleCreateTeam}>
            <div className="mb-4">
              <label htmlFor="teamName" className="block text-lg font-medium text-gray-700 mb-2">Team Name</label>
              <input 
                type="text" 
                id="teamName" 
                required 
                className="form-input"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="projectIdea" className="block text-lg font-medium text-gray-700 mb-2">Project Idea</label>
              <textarea 
                id="projectIdea" 
                rows="3" 
                className="form-textarea"
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-lg font-medium text-gray-700 mb-2">Skills Needed</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input 
                    type="checkbox" 
                    id="frontend" 
                    className="form-checkbox"
                    checked={skills.frontend}
                    onChange={handleSkillChange}
                  />
                  <label htmlFor="frontend" className="ml-2">Frontend</label>
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    id="backend" 
                    className="form-checkbox"
                    checked={skills.backend}
                    onChange={handleSkillChange}
                  />
                  <label htmlFor="backend" className="ml-2">Backend</label>
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    id="ml" 
                    className="form-checkbox"
                    checked={skills.ml}
                    onChange={handleSkillChange}
                  />
                  <label htmlFor="ml" className="ml-2">Machine Learning</label>
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    id="design" 
                    className="form-checkbox"
                    checked={skills.design}
                    onChange={handleSkillChange}
                  />
                  <label htmlFor="design" className="ml-2">UI/UX Design</label>
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    id="mobile" 
                    className="form-checkbox"
                    checked={skills.mobile}
                    onChange={handleSkillChange}
                  />
                  <label htmlFor="mobile" className="ml-2">Mobile Dev</label>
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    id="other" 
                    className="form-checkbox"
                    checked={skills.other}
                    onChange={handleSkillChange}
                  />
                  <label htmlFor="other" className="ml-2">Other</label>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="contactEmail" className="block text-lg font-medium text-gray-700 mb-2">Contact Email</label>
              <input 
                type="email" 
                id="contactEmail" 
                required 
                className="form-input"
                placeholder="your@email.com"
              />
            </div>
            
            <button type="submit" className="carnival-button w-full">Create Team</button>
          </form>
        </div>
      </div>
    </main>
  );
}