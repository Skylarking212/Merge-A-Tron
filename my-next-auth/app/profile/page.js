'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [academicLevel, setAcademicLevel] = useState('');
    const [description, setDescription] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [extractedSkills, setExtractedSkills] = useState({
        backend: 0,
        frontend: 0,
        fullstack: 0,
        skills: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        async function getProfile() {
            setIsLoading(true);

            // Check if user is logged in
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/');
                return;
            }

            setUser(session.user);

            // Get user profile from User table
            const { data, error } = await supabase
                .from('User')
                .select('*')
                .eq('email', session.user.email)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else if (data) {
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                setEmail(data.email || '');
                setAcademicLevel(data.academic_level || '');
                setDescription(data.description || '');

                // Fetch skills from Skills table
                const { data: skillsData, error: skillsError } = await supabase
                    .from('Skills')
                    .select('*')
                    .eq('user_id', data.user_id);

                if (skillsError) {
                    console.error('Error fetching skills:', skillsError);
                } else if (skillsData && skillsData.length > 0) {
                    // Format skills data to match expected structure
                    const formattedSkills = skillsData.map(skill => ({
                        name: skill.skill_name,
                        level: parseInt(skill.skill_level, 10) || 5
                    }));

                    // TODO: Update this with actual backend/frontend/fullstack ratings
                    // For now we'll just use placeholder values or calculate averages
                    setExtractedSkills({
                        backend: 7, // Placeholder
                        frontend: 7, // Placeholder
                        fullstack: 7, // Placeholder
                        skills: formattedSkills
                    });
                }
            }

            setIsLoading(false);
        }

        getProfile();
    }, [router]);

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setResumeFile(file);
        }
    };

    const parseResume = async () => {
        if (!resumeFile) return;

        setIsSubmitting(true);
        setMessage('Analyzing resume...');

        try {
            const formData = new FormData();
            formData.append('resume', resumeFile);

            const response = await fetch('/api/parse-resume', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to parse resume');
            }

            const data = await response.json();
            console.log("API Response:", data); // Debug log

            setExtractedSkills(data);
            setMessage('Resume analyzed successfully! Skills have been rated.');
        } catch (error) {
            console.error('Error parsing resume:', error);
            setMessage('Error analyzing resume. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            if (!user || !user.id) {
                throw new Error('User session not found');
            }

            // Get user_id from User table based on email
            const { data: userData, error: userError } = await supabase
                .from('User')
                .select('user_id')
                .eq('email', email)
                .single();

            if (userError) throw userError;
            if (!userData || !userData.user_id) throw new Error('User ID not found');

            const userId = userData.user_id;

            // Update profile in User table
            const { error } = await supabase
                .from('User')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    academic_level: academicLevel,
                    description: description
                })
                .eq('email', email);

            if (error) throw error;

            // If we have extracted skills, save them to Skills table
            if (extractedSkills.skills && extractedSkills.skills.length > 0) {
                // First, delete any existing skills for this user
                const { error: deleteError } = await supabase
                    .from('Skills')
                    .delete()
                    .eq('user_id', userId);

                if (deleteError) {
                    console.error('Error deleting existing skills:', deleteError);
                }

                // Then insert new skills
                const skillsToInsert = extractedSkills.skills.map(skill => ({
                    user_id: userId,
                    skill_name: skill.name,
                    skill_level: String(skill.level)
                }));

                if (skillsToInsert.length > 0) {
                    const { error: skillsError } = await supabase
                        .from('Skills')
                        .insert(skillsToInsert);

                    if (skillsError) {
                        console.error('Error inserting skills:', skillsError);
                        throw skillsError;
                    }
                }
            }

            setMessage('Profile updated successfully!');

            // Add a short delay so the user can see the success message before redirecting
            setTimeout(() => {
                router.push('/'); // Navigate back to home page
            }, 1500);

        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Error updating profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900/80 via-indigo-900/80 to-slate-900/90 flex items-center justify-center">
                <div className="text-white text-2xl">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-fixed bg-cover bg-center bg-no-repeat relative">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/80 to-slate-900/90 z-0"></div>
            <div className="relative z-10 min-h-screen pt-24 pb-16 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-8 rounded-2xl shadow-lg border border-slate-700/50 backdrop-blur-sm">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
                            Your Profile
                        </h1>

                        {message && (
                            <div className={`p-4 mb-6 rounded-lg ${message.includes('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-blue-100 font-medium">First Name</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-blue-100 font-medium">Last Name</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-blue-100 font-medium">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-300"
                                    disabled
                                />
                                <p className="text-slate-400 text-sm">Email cannot be changed</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-blue-100 font-medium">Academic Level</label>
                                <select
                                    value={academicLevel}
                                    onChange={(e) => setAcademicLevel(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                >
                                    <option value="">Select your academic level</option>
                                    <option value="Freshman">Freshman</option>
                                    <option value="Sophomore">Sophomore</option>
                                    <option value="Junior">Junior</option>
                                    <option value="Senior">Senior</option>
                                    <option value="Graduate">Graduate Student</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-blue-100 font-medium">About You</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                    placeholder="Tell others about yourself, your skills, and what you're looking to work on..."
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-blue-100 font-medium">Upload Resume for Skill Analysis</label>
                                <div className="flex flex-col space-y-3">
                                    <input
                                        type="file"
                                        onChange={handleResumeChange}
                                        accept=".pdf,.doc,.docx"
                                        className="hidden"
                                        id="resume-upload"
                                    />
                                    <label
                                        htmlFor="resume-upload"
                                        className="cursor-pointer py-3 px-4 bg-slate-800 border border-slate-600 border-dashed rounded-lg text-center text-blue-300 hover:bg-slate-700 transition-colors"
                                    >
                                        Click to upload resume (PDF, DOC, DOCX)
                                    </label>

                                    {resumeFile && (
                                        <div className="text-green-300">
                                            Selected: {resumeFile.name}
                                            <button
                                                type="button"
                                                onClick={parseResume}
                                                disabled={isSubmitting}
                                                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded disabled:opacity-70"
                                            >
                                                {isSubmitting ? 'Analyzing...' : 'Analyze Resume'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Debug - Raw Skills Data */}
                            <div className="mt-4 p-4 bg-slate-800/70 rounded-lg">
                                <h3 className="text-white text-lg font-medium">Debug - Raw Skills Data:</h3>
                                <pre className="text-xs text-gray-300 mt-2 overflow-auto">
                                    {JSON.stringify(extractedSkills, null, 2)}
                                </pre>
                            </div>

                            {extractedSkills.skills && extractedSkills.skills.length > 0 && (
                                <div className="space-y-4">
                                    <label className="block text-blue-100 font-medium text-xl">Your Skills Analysis</label>

                                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-4">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium text-blue-300">Development Areas</h3>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                                                    <div className="text-sm text-blue-200 mb-1">Backend</div>
                                                    <div className="text-2xl font-bold text-white">{extractedSkills.backend}/10</div>
                                                </div>
                                                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                                                    <div className="text-sm text-blue-200 mb-1">Frontend</div>
                                                    <div className="text-2xl font-bold text-white">{extractedSkills.frontend}/10</div>
                                                </div>
                                                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                                                    <div className="text-sm text-blue-200 mb-1">Fullstack</div>
                                                    <div className="text-2xl font-bold text-white">{extractedSkills.fullstack}/10</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium text-blue-300">Individual Skills</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {extractedSkills.skills.map((skill, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-slate-700/30 p-3 rounded">
                                                        <span className="text-blue-200">{skill.name}</span>
                                                        <span className="bg-blue-600 px-2 py-1 rounded text-xs text-white">
                                                            {skill.level}/10
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md font-medium disabled:opacity-70"
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}