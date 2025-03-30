"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

/* ----------------- Child Components (Memoized) ----------------- */

const NavTab = memo(({ label, onClick, isActive }) => (
	<button
		onClick={onClick}
		className={`
      ${
			isActive
				? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg"
				: "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
		}
      px-12 py-0 text-center font-bold rounded-full transition-all focus:outline-none transform hover:scale-105 active:scale-95
    `}
	>
		{label}
	</button>
));

const CountdownUnit = memo(({ value, label, icon }) => (
	<div className="flex flex-col items-center">
		<div className="relative">
			<div className="bg-[#911b0b] text-6xl font-bold text-[#FFFFFF] rounded-2xl p-6 shadow-lg flex items-center justify-center w-24 h-24 min-w-24">
				{value.toString().padStart(2, "0")}
			</div>
		</div>
		<div className="text-xl font-medium text-white mt-3">{label}</div>
	</div>
));

const ScheduleItem = memo(({ time, activity, location }) => (
	<div className="py-4 border-b border-blue-100 hover:bg-blue-50/10 transition-colors rounded-lg px-4 group">
		<div className="flex justify-between items-start">
			<div>
				<div className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">
					{activity}
				</div>
				<div className="text-blue-200">@ {location}</div>
			</div>
			<div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
				{time}
			</div>
		</div>
	</div>
));

const FAQItem = memo(({ question, answer }) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div className="faq-button mb-4 bg-gradient-to-r from-slate-800/70 to-slate-900/70 p-4 rounded-xl shadow hover:shadow-md transition-shadow backdrop-blur-sm border border-slate-900/50">
			<button
				className="font-bold text-lg text-white w-full text-left flex justify-between items-center"
				onClick={() => setIsOpen(!isOpen)}
			>
				{question}
				<span
					className={`transform transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</span>
			</button>
			{isOpen && (
				<div className="mt-3">
					{answer ? (
						<p className="text-blue-100">{answer}</p>
					) : (
						<p className="text-blue-300 italic">
							Answer coming soon...
						</p>
					)}
				</div>
			)}
		</div>
	);
});

const PrizeItem = memo(
	({ title, description, prize, color = "from-indigo-500 to-blue-600" }) => (
		<div
			className={`bg-gradient-to-r ${color} p-[3px] rounded-2xl shadow-lg mb-6 backdrop-blur-sm`}
		>
			<div className="bg-slate-900/80 p-6 rounded-2xl h-full">
				<h3 className="font-bold text-xl text-white mb-3">{title}</h3>
				<p className="my-3 text-blue-100">{description}</p>
				<div className="font-bold text-white p-3 bg-slate-800/70 rounded-xl mt-4">
					{prize}
				</div>
			</div>
		</div>
	)
);

const GlowingBadge = memo(
	({ children, color = "glowy from-blue-500 to-purple-600" }) => (
		<span
			className={`relative inline-block bg-gradient-to-r ${color} px-4 py-2 rounded-lg text-white font-semibold text-sm`}
		>
			{children}
		</span>
	)
);

/* ----------------- Countdown Timer Component ----------------- */

const CountdownTimer = () => {
	const [timeLeft, setTimeLeft] = useState({
		days: 0,
		hours: 20,
		minutes: 54,
		seconds: 43,
	});

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev.seconds > 0) {
					return { ...prev, seconds: prev.seconds - 1 };
				} else if (prev.minutes > 0) {
					return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
				} else if (prev.hours > 0) {
					return {
						...prev,
						hours: prev.hours - 1,
						minutes: 59,
						seconds: 59,
					};
				} else if (prev.days > 0) {
					return {
						...prev,
						days: prev.days - 1,
						hours: 23,
						minutes: 59,
						seconds: 59,
					};
				} else {
					clearInterval(timer);
					return prev;
				}
			});
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	return (
		// className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-700 rounded-3xl p-8 shadow-2xl border border-indigo-500/50 overflow-hidden relative">
		<div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-700 p-8 rounded-3xl shadow-2xl mt-6 backdrop-blur-md border border-indigo-500/50">
			<div className="grid grid-cols-4 text-center">
				<CountdownUnit value={timeLeft.days} label="Days" />
				<CountdownUnit value={timeLeft.hours} label="Hours" />
				<CountdownUnit value={timeLeft.minutes} label="Minutes" />
				<CountdownUnit value={timeLeft.seconds} label="Seconds" />
			</div>

			<h3 className="text-center text-3xl font-bold text-[#CCCF9A] mt-10">
				UNTIL THE END OF THE HACKATHON!
			</h3>
		</div>
	);
};

/* ----------------- Main Home Component ----------------- */

export default function Home() {
	const router = useRouter();
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [authMode, setAuthMode] = useState("signin");
	const [activeTab, setActiveTab] = useState("info");

	// Check if user is logged in (runs once on mount)
	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev.seconds > 0) {
					return { ...prev, seconds: prev.seconds - 1 };
				} else if (prev.minutes > 0) {
					return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
				} else if (prev.hours > 0) {
					return {
						...prev,
						hours: prev.hours - 1,
						minutes: 59,
						seconds: 59,
					};
				} else if (prev.days > 0) {
					return {
						...prev,
						days: prev.days - 1,
						hours: 23,
						minutes: 59,
						seconds: 59,
					};
				} else {
					clearInterval(timer);
					return prev;
				}
			});
		}, 1000);

		// Check if user is logged in
		const getSession = async () => {
			const { data } = await supabase.auth.getSession();
			if (data && data.session) {
				setIsLoggedIn(true);
			}
		};
		getSession();
	}, []);

	// Memoize auth handler so it isn’t re-created on every render
	const handleAuth = useCallback(
		async (e) => {
			e.preventDefault();
			try {
				if (authMode === "signup") {
					const { error } = await supabase.auth.signUp({
						email,
						password,
					});
					if (error) throw error;
					setShowAuthModal(false);
				} else {
					const { error } = await supabase.auth.signInWithPassword({
						email,
						password,
					});
					if (error) throw error;
					setIsLoggedIn(true);
					setShowAuthModal(false);
				}
			} catch (error) {
				console.error("Auth error:", error);
			}
		},
		[authMode, email, password]
	);

	const renderContent = () => {
		switch (activeTab) {
			case "info":
				return (
					<div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-8 rounded-2xl shadow-lg border border-slate-700/50 backdrop-blur-sm">
						<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
							HackPSU Information
						</h2>
						<p className="text-lg text-blue-100 mb-8">
							Welcome to HackPSU, Penn State's largest hackathon!
							Get ready for 24 hours of coding, creativity, and
							collaboration.
						</p>
						<div className="bg-slate-800/50 p-6 rounded-xl mb-8 border border-slate-700/50">
							<h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
								Rules
							</h3>
							<ul className="space-y-4 text-blue-100 list-inside list-disc">
								<li>
									All participants must be at least 18 years
									old and a student of some university (or a
									recent graduate within one year).
								</li>
								<li>
									Teams may be comprised of up to five
									members. A team may only submit one project.
								</li>
								<li>
									Projects should be original works created on
									site. Do not work on an existing project.
								</li>
								<li>
									All projects must be submitted through
									Devpost by 12PM on Sunday (even if not
									completed!) and can be edited until 1:30PM
									Sunday.
								</li>
								<li>
									All project code must be attached to the
									project's Devpost submission.
								</li>
								<li>
									Students are permitted to come and go from
									the venue as they please.
								</li>
								<li>
									Anything you create is your work, HackPSU
									and its partners have no claim over
									intellectual property produced.
								</li>
								<li>
									All participants must agree to the MLH Code
									of Conduct.
								</li>
							</ul>
						</div>
						<h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
							FAQ
						</h3>
						<div className="space-y-4">
							<FAQItem question="Where can I go to get help?" />
							<FAQItem question="Do I need to stay at the event the whole time?" />
							<FAQItem question="Can I sleep at the hackathon?" />
							<FAQItem question="Can I be reimbursed for travel?" />
							<FAQItem question="How does extra credit work?" />
							<FAQItem question="How should I submit a project?" />
							<FAQItem question="What is Devpost?" />
							<FAQItem
								question="When are project submissions due?"
								answer="All projects must be submitted through Devpost by 12PM on Sunday (even if not completed!) and can be edited until 1:45PM Sunday."
							/>
						</div>
					</div>
				);
			case "schedule":
				return (
					<div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-8 rounded-2xl shadow-lg border border-slate-700/50 backdrop-blur-sm">
						<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
							Event Schedule
						</h2>
						{/* Example schedule content */}
						<div className="mb-8">
							<div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-t-xl font-bold text-xl flex items-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="mr-2"
								>
									<rect
										x="3"
										y="4"
										width="18"
										height="18"
										rx="2"
										ry="2"
									></rect>
									<line x1="16" y1="2" x2="16" y2="6"></line>
									<line x1="8" y1="2" x2="8" y2="6"></line>
									<line x1="3" y1="10" x2="21" y2="10"></line>
								</svg>
								Saturday, March 29
							</div>
							<div className="bg-slate-800/40 rounded-b-xl divide-y divide-slate-700/50">
								<ScheduleItem
									location="Atrium"
									activity="Merch Handout"
									time="10:00 AM"
								/>
								<ScheduleItem
									location="Auditorium"
									activity="Opening Ceremonies"
									time="12:00 PM"
								/>
								<ScheduleItem
									location="Atrium"
									activity="Lunch"
									time="1:00 PM"
								/>
								<ScheduleItem
									location="Atrium"
									activity="Hacking Begins"
									time="2:00 PM"
								/>
								<ScheduleItem
									location="Atrium"
									activity="Dinner"
									time="7:00 PM"
								/>
								<ScheduleItem
									location="Atrium"
									activity="Air Mattress Handout"
									time="10:00 PM"
								/>
							</div>
						</div>
						<div className="mb-8">
							<div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-t-xl font-bold text-xl flex items-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="mr-2"
								>
									<rect
										x="3"
										y="4"
										width="18"
										height="18"
										rx="2"
										ry="2"
									></rect>
									<line x1="16" y1="2" x2="16" y2="6"></line>
									<line x1="8" y1="2" x2="8" y2="6"></line>
									<line x1="3" y1="10" x2="21" y2="10"></line>
								</svg>
								Sunday, March 30
							</div>
							<div className="bg-slate-800/40 rounded-b-xl divide-y divide-slate-700/50">
								<ScheduleItem
									location="Atrium"
									activity="Midnight Snack"
									time="12:00 AM"
								/>
								<ScheduleItem
									location="Atrium"
									activity="Brunch"
									time="10:00 AM"
								/>
								<ScheduleItem
									location="Atrium"
									activity="Air Mattress Return"
									time="10:00 AM"
								/>
								<ScheduleItem
									location="Atrium"
									activity="Hacking Ends"
									time="1:45 PM"
								/>
								<ScheduleItem
									location="Atrium"
									activity="Judging Expo"
									time="2:00 PM"
								/>
								<ScheduleItem
									location="Atrium"
									activity="Closing Ceremonies"
									time="4:30 PM"
								/>
							</div>
						</div>
						<div className="bg-gradient-to-r from-red-600 to-red-500 p-5 rounded-xl text-white mt-8 shadow-lg flex items-start space-x-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="flex-shrink-0 mt-1"
							>
								<circle cx="12" cy="12" r="10"></circle>
								<line x1="12" y1="8" x2="12" y2="12"></line>
								<line x1="12" y1="16" x2="12.01" y2="16"></line>
							</svg>
							<div>
								<h3 className="font-bold text-xl mb-2">
									IMPORTANT SUBMISSION DEADLINE
								</h3>
								<p>
									All projects must be submitted through
									Devpost by{" "}
									<span className="font-bold text-yellow-200">
										12PM on Sunday
									</span>
									. You can edit your submission until{" "}
									<span className="font-bold text-yellow-200">
										1:45PM Sunday
									</span>
									. This is a hard deadline!
								</p>
							</div>
						</div>
					</div>
				);
			case "prizes":
				return (
					<div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-8 rounded-2xl shadow-lg border border-slate-700/50 backdrop-blur-sm">
						<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
							Prizes & Challenges
						</h2>
						<div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-[3px] rounded-2xl shadow-xl mb-8">
							<div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 rounded-2xl">
								<h3 className="font-bold text-2xl bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent mb-3">
									HackPSU Grand Prize
								</h3>
								<p className="mb-4 text-blue-100">
									The standard HackPSU experience: work
									together alone or in a team to build
									something awesome! All monetary prizes will
									be split among the winning team members
									equally.
								</p>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
									<div className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 p-6 rounded-xl backdrop-blur-sm">
										<div className="text-center">
											<div className="text-lg font-bold text-yellow-300 mb-2">
												1st Place
											</div>
											<div className="text-3xl font-extrabold text-white">
												$350
											</div>
											<div className="text-sm text-yellow-200">
												in cash
											</div>
										</div>
									</div>
									<div className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 p-6 rounded-xl backdrop-blur-sm">
										<div className="text-center">
											<div className="text-lg font-bold text-slate-300 mb-2">
												2nd Place
											</div>
											<div className="text-3xl font-extrabold text-white">
												$200
											</div>
											<div className="text-sm text-slate-300">
												in cash
											</div>
										</div>
									</div>
									<div className="bg-gradient-to-r from-amber-700/30 to-amber-600/30 p-6 rounded-xl backdrop-blur-sm">
										<div className="text-center">
											<div className="text-lg font-bold text-amber-300 mb-2">
												3rd Place
											</div>
											<div className="text-3xl font-extrabold text-white">
												$150
											</div>
											<div className="text-sm text-amber-200">
												in cash
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<PrizeItem
								title="Machine Learning"
								description="Engineer an innovative, efficient, and scalable model to effectively address a real world problem."
								prize="$100 in cash, won by the team and split among the members"
								color="from-blue-600 to-cyan-500"
							/>
							<PrizeItem
								title="Entrepreneurship"
								description="From hackathon to startup? Develop a technical solution with a robust and viable business strategy."
								prize="$100 in cash, won by the team and split among the members"
								color="from-green-600 to-emerald-500"
							/>
							<PrizeItem
								title="10th Anniversary: Timeless Tech"
								description="Draw inspiration from groundbreaking tech, media, and trends of the past and transform them into something entirely new, pushing boundaries beyond imitation."
								prize="$100 in cash, won by the team and split among the members"
								color="from-purple-600 to-indigo-500"
							/>
							<PrizeItem
								title="ICDS Challenge - LIDAR Data Classification"
								description="Utilizing the point cloud provided by the ICDS for the Center for Immersive Experience lab, create a script to automatically classify distinct objects within the space."
								prize={
									<div className="space-y-2">
										<p>
											• ICDS developed press release on
											winning team's submission
										</p>
										<p>
											• Social media promotion on ICDS
											branded channels
										</p>
										<p>
											• LinkedIn endorsement referencing
											winning team's submission
										</p>
										<p>
											• Presentation invite to a future
											ICDS Lunch and Learn
										</p>
									</div>
								}
								color="from-red-600 to-orange-500"
							/>
						</div>
						<div className="mt-10 p-6 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 rounded-xl border border-blue-500/30 backdrop-blur-sm">
							<h3 className="font-bold text-xl mb-3 flex items-center text-white">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="mr-2 text-blue-400"
								>
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="12" y1="8" x2="12" y2="12"></line>
									<line
										x1="12"
										y1="16"
										x2="12.01"
										y2="16"
									></line>
								</svg>
								SUBMISSIONS
							</h3>
							<p className="mb-3 text-blue-100">
								To submit, please visit our Devpost page at{" "}
								<a
									href="http://devpost.hackpsu.org"
									className="text-blue-300 underline font-bold hover:text-blue-200 transition-colors"
								>
									devpost.hackpsu.org
								</a>
							</p>
							<ul className="list-disc pl-6 space-y-2 text-blue-100">
								<li>
									Submit your project (even if not completed)
									by <GlowingBadge>12 PM Sunday</GlowingBadge>
								</li>
								<li>
									You can edit until{" "}
									<GlowingBadge color="from-purple-500 to-pink-600">
										1:45 PM Sunday
									</GlowingBadge>
								</li>
								<li>
									This is a hard deadline - the submission
									portal closes at 12 PM
								</li>
								<li>
									Projects not submitted will not be
									considered for prizes
								</li>
							</ul>
						</div>
					</div>
				);
			case "teams":
			case "sponsors":
			case "workshops":
				return (
					<div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-8 rounded-2xl shadow-lg border border-slate-700/50 backdrop-blur-sm">
						<div className="py-10">
							<div className="flex flex-col items-center">
								<div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-full flex items-center justify-center mb-8">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="64"
										height="64"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="text-white"
									>
										{activeTab === "teams" && (
											<>
												<circle
													cx="12"
													cy="7"
													r="4"
												></circle>
												<path d="M4.22 19.24a9.57 9.57 0 0 1 15.56 0"></path>
											</>
										)}
									</svg>
								</div>
								<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
									{activeTab.charAt(0).toUpperCase() +
										activeTab.slice(1)}
								</h2>
								<p className="text-xl text-blue-100 text-center max-w-2xl mb-8">
									{activeTab === "teams" &&
										"Team registration will open soon. Form your team of up to 5 members and get ready to build something amazing!"}
									{activeTab === "sponsors" &&
										"Our sponsors make HackPSU possible. Check back soon to see which companies are supporting innovation at Penn State!"}
									{activeTab === "workshops" &&
										"Learn new skills with our interactive workshops. Schedule and topics coming soon!"}
								</p>
								<button
									onClick={() => {}}
									className={`
                    ${
						activeTab === "teams"
							? "bg-gradient-to-r from-indigo-600 to-blue-700"
							: activeTab === "sponsors"
							? "bg-gradient-to-r from-purple-600 to-pink-700"
							: "bg-gradient-to-r from-orange-600 to-red-700"
					}
                    text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95
                  `}
								>
									{activeTab === "teams"
										? "Coming Soon"
										: activeTab === "sponsors"
										? "Become a Sponsor"
										: "Check Back Later"}
								</button>
							</div>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div
			className="min-h-screen w-full bg-fixed bg-cover bg-center bg-no-repeat relative"
			style={{
				backgroundImage: "url('/images/background.jpg')",
				backgroundSize: "100% 150vw",
				backgroundPosition: "top left",
			}}
		>
			<div className="ballon-container">
				<img
					src="/images/ballon.png"
					className="balloon moving-image top-left-balloon"
					alt="Balloon 1"
				/>
				<img
					src="/images/ballon.png"
					className="balloon moving-image bottom-right-balloon"
					alt="Balloon 2"
				/>
			</div>

			{/* Gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/80 to-slate-900/90 z-0"></div>
			<div className="relative z-10 min-h-screen">
				{/* Header */}
				<header className="glowy backdrop-blur-md bg-slate-900/30 border-b border-slate-700/30 sticky top-0 z-20">
					<nav className="container glowy mx-auto flex flex-wrap justify-center gap-3 px-4 py-5 height-10">
						<NavTab
							label="INFO"
							onClick={() => setActiveTab("info")}
							isActive={activeTab === "info"}
						/>
						<NavTab
							label="SCHEDULE"
							onClick={() => setActiveTab("schedule")}
							isActive={activeTab === "schedule"}
						/>
						<NavTab
							label="PRIZES"
							onClick={() => setActiveTab("prizes")}
							isActive={activeTab === "prizes"}
						/>
						<NavTab
							label="TEAMS"
							onClick={() => setActiveTab("teams")}
							isActive={activeTab === "teams"}
						/>
						<NavTab
							label={authMode == "signup" ? "Sign Up" : "Sign In"}
							onClick={() =>
								!isLoggedIn && setShowAuthModal(true)
							}
							isActive={false}
						/>
					</nav>
				</header>

				{/* Main Content */}
				<main className="container mx-auto px-4 py-10">
					<div className="max-w-5xl mx-auto">
						{/* Ticket Booth */}
						<div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-700 rounded-3xl p-8 shadow-2xl border border-indigo-500/50 overflow-hidden relative">
							<div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
							<div className="absolute bottom-5 left-5 w-20 h-20 bg-purple-500/20 rounded-full blur-lg"></div>
							<h1
								className="text-center text-7xl font-extrabold font-sans drop-shadow-md"
								style={{ color: "#911b0b" }}
							>
								HACK<span className="text-blue-100">PSU</span>
							</h1>
							<h2 className="text-center text-3xl font-bold text-white mt-2">
								24 HOURS OF INNOVATION
							</h2>
							<div className="flex justify-around mt-8">
								{Array(8)
									.fill()
									.map((_, i) => (
										<div
											key={i}
											className="w-5 h-5 rounded-full bg-indigo-900/50 border border-indigo-400/40"
										></div>
									))}
							</div>
						</div>

						{/* Countdown Timer (Isolated Component) */}
						<CountdownTimer />

						{/* Content based on Active Tab */}
						<div className="mt-12 mb-12">{renderContent()}</div>
					</div>
				</main>

				{/* Auth Modal */}

				{showAuthModal && (
					<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
						<div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl max-w-md w-full p-6 relative shadow-xl border border-slate-700">
							<button
								onClick={() => setShowAuthModal(false)}
								className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18"></line>
									<line x1="6" y1="6" x2="18" y2="18"></line>
								</svg>
							</button>
							<h2 className="text-2xl font-bold mb-6 text-center text-white bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
								{authMode === "signin"
									? "Get Your Ticket!"
									: "Register for HackPSU"}
							</h2>
							<form onSubmit={handleAuth} className="space-y-5">
								<div className="space-y-2">
									<label
										className="block text-blue-100 mb-1 font-medium"
										htmlFor="email"
									>
										Email
									</label>
									<input
										className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
										type="email"
										id="email"
										value={email}
										onChange={(e) =>
											setEmail(e.target.value)
										}
										required
										placeholder="your.email@example.com"
									/>
								</div>
								<div className="space-y-2">
									<label
										className="block text-blue-100 mb-1 font-medium"
										htmlFor="password"
									>
										Password
									</label>
									<input
										className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
										type="password"
										id="password"
										value={password}
										onChange={(e) =>
											setPassword(e.target.value)
										}
										required
										placeholder="••••••••"
									/>
								</div>
								<button
									className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md font-medium"
									type="submit"
								>
									{authMode === "signin"
										? "Sign In"
										: "Register"}
								</button>
							</form>
							<div className="mt-6 text-center">
								{authMode === "signin" ? (
									<p className="text-slate-300">
										Need a ticket?{" "}
										<button
											className="text-blue-400 font-medium hover:text-blue-300 hover:underline transition-colors"
											onClick={() =>
												setAuthMode("signup")
											}
										>
											Register Here
										</button>
									</p>
								) : (
									<p className="text-slate-300">
										Already have a ticket?{" "}
										<button
											className="text-blue-400 font-medium hover:text-blue-300 hover:underline transition-colors"
											onClick={() =>
												setAuthMode("signin")
											}
										>
											Sign In
										</button>
									</p>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Footer */}
				<footer className="mt-20 bg-gradient-to-t from-slate-900 to-transparent py-8 text-center">
					<div className="container mx-auto px-4">
						<div className="flex flex-col items-center">
							<h2 className="text-2xl font-bold text-white mb-4">
								HackPSU Spring 2025
							</h2>
							<p className="text-blue-200 mb-6">
								Learn. Build. Share.
							</p>
							<div className="flex space-x-6">
								<a
									href="https://twitter.com/hackpsu"
									className="text-blue-400 hover:text-blue-300 transition-colors"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
									</svg>
								</a>
								<a
									href="https://www.instagram.com/hackpsu/"
									className="text-pink-400 hover:text-pink-300 transition-colors"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<rect
											x="2"
											y="2"
											width="20"
											height="20"
											rx="5"
											ry="5"
										></rect>
										<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
										<line
											x1="17.5"
											y1="6.5"
											x2="17.51"
											y2="6.5"
										></line>
									</svg>
								</a>
								<a
									href="https://github.com/hackpsu"
									className="text-slate-400 hover:text-slate-300 transition-colors"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
									</svg>
								</a>
							</div>
						</div>
					</div>
				</footer>
			</div>

			{/* Global CSS */}
			<style jsx global>{`
				@keyframes stars {
					0% {
						background-position: 0 0;
					}
					100% {
						background-position: 200px 200px;
					}
				}
				.bg-clip-text {
					-webkit-background-clip: text;
					background-clip: text;
				}
				.transition-all {
					transition-property: transform, box-shadow, background-color,
						border-color, opacity;
					transition-duration: 0.2s;
					transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
				}
				.transform {
					will-change: transform;
				}
				.backdrop-blur-sm {
					backdrop-filter: blur(4px);
					-webkit-backdrop-filter: blur(4px);
				}
				.backdrop-blur-md {
					backdrop-filter: blur(8px);
					-webkit-backdrop-filter: blur(8px);
				}
			`}</style>
		</div>
	);
}
