"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function TeamDetailPageClient({ team_id }) {
	const router = useRouter();
	const [team, setTeam] = useState(null);
	const [members, setMembers] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	// Navigation tab component
	const NavTab = ({ label, isActive, onClick }) => (
		<div onClick={onClick} className="cursor-pointer">
			<div
				className={`bg-yellow-400 px-6 py-1 text-center font-bold border border-yellow-500 ${
					isActive ? "bg-yellow-500" : ""
				}`}
			>
				{label}
			</div>
		</div>
	);

	useEffect(() => {
		const fetchTeamDetails = async () => {
			try {
				console.log("Fetching team details for team_id:", team_id);

				// Fetch team details
				const { data: teamData, error: teamError } = await supabase
					.from("Team")
					.select("*")
					.eq("team_id", team_id)
					.single();

				if (teamError) throw teamError;
				console.log("Team data:", teamData);
				setTeam(teamData);

				// Fetch team members
				const { data: memberData, error: memberError } = await supabase
					.from("Member")
					.select(
						`
            member_id,
            user_id
          `
					)
					.eq("team_id", team_id);

				console.log(memberData);
				if (memberError) throw memberError;
				console.log("Member data:", memberData);

				console.log(memberData);
				const memberIds = memberData.map((member) => member.user_id);

				// 2. Fetch users from the User table where user_id is in the array of memberIds
				const { data: userData, error: userError } = await supabase
					.from("User")
					.select("user_id, first_name, last_name, interests")
					.in("user_id", memberIds);

				if (userError) throw userError;

				// Format member data

				console.log(userData);
				const formattedMembers = userData.map((m) => ({
					userId: m.user_id,
					username: `${m.first_name} ${m.last_name}`,
					skills: m.interests.split(","), // Assuming skills is an array
				}));

				setMembers(formattedMembers);
			} catch (error) {
				console.error("Error fetching team details:", error);

				// Fallback data for development
				console.log("Setting fallback data for team_id:", team_id);
				setTeam({
					team_id: team_id,
					name: `Example Team ${team_id}`,
					description: "Example team description",
					max_members: 5,
				});

				// setMembers([
				//   { userId: 1, username: "John Doe", skills: ["JavaScript", "React"] },
				//   { userId: 2, username: "Jane Smith", skills: ["Python", "Data Science"] }
				// ]);
			} finally {
				setIsLoading(false);
			}
		};

		if (team_id) {
			fetchTeamDetails();
		}
	}, [team_id]);

	// Render five position slots dynamically
	const renderPositions = () => {
		const positions = [];
		for (let i = 0; i < 5; i++) {
			const member = i < members.length ? members[i] : null;
			positions.push(
				<div key={i} className="bg-white rounded-lg p-6 shadow mb-4">
					<h3 className="text-lg font-semibold text-red-800">
						Position {i + 1}
					</h3>
					{member ? (
						<div>
							<p className="font-medium">{member.username}</p>
							<p className="text-gray-600 mt-1">
								Skills:{" "}
								{member.skills && member.skills.length > 0
									? member.skills.join(", ")
									: "No skills listed"}
							</p>
						</div>
					) : (
						<div className="flex items-center justify-center p-4 text-gray-400">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-8 w-8"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 4v16m8-8H4"
								/>
							</svg>
						</div>
					)}
				</div>
			);
		}
		return positions;
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-sky-300 flex justify-center items-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-800"></div>
			</div>
		);
	}

	if (!team) {
		return (
			<div className="min-h-screen bg-sky-300">
				<header className="bg-red-800">
					<nav className="container mx-auto flex justify-around px-4 py-4">
						<NavTab label="INFO" onClick={() => router.push("/")} />
						<NavTab
							label="SCHEDULE"
							onClick={() => router.push("/")}
						/>
						<NavTab
							label="PRIZES"
							onClick={() => router.push("/")}
						/>
						<NavTab
							label="TEAMS"
							isActive={true}
							onClick={() => router.push("/teams")}
						/>
						<NavTab
							label="SPONSORS"
							onClick={() => router.push("/")}
						/>
						<NavTab
							label="WORKSHOPS"
							onClick={() => router.push("/")}
						/>
						<NavTab
							label="PROFILE"
							onClick={() => router.push("/")}
						/>
					</nav>
				</header>
				<main className="container mx-auto px-4 py-10">
					<div className="bg-white rounded-xl p-8 shadow-lg mb-8">
						<h1 className="text-3xl font-bold text-red-800 mb-4">
							Error Loading Team
						</h1>
						<p>Could not load team details. Team ID: {team_id}</p>
						<button
							onClick={() => router.push("/teams")}
							className="mt-4 px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700"
						>
							Back to Teams
						</button>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-sky-300">
			{/* Header with navigation */}
			<header className="bg-red-800">
				<nav className="container mx-auto flex justify-around px-4 py-4">
					<NavTab label="INFO" onClick={() => router.push("/")} />
					<NavTab label="SCHEDULE" onClick={() => router.push("/")} />
					<NavTab label="PRIZES" onClick={() => router.push("/")} />
					<NavTab
						label="TEAMS"
						isActive={true}
						onClick={() => router.push("/teams")}
					/>
					<NavTab label="SPONSORS" onClick={() => router.push("/")} />
					<NavTab
						label="WORKSHOPS"
						onClick={() => router.push("/")}
					/>
					<NavTab label="PROFILE" onClick={() => router.push("/")} />
				</nav>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-10">
				<div className="mb-6">
					<button
						onClick={() => router.push("/teams")}
						className="flex items-center text-red-800 font-medium"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5 mr-1"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
								clipRule="evenodd"
							/>
						</svg>
						Back to Teams
					</button>
				</div>

				<div className="bg-white rounded-xl p-8 shadow-lg mb-8">
					<h1 className="text-3xl font-bold text-red-800 mb-2">
						{team?.name || "Team"}
					</h1>
					<p className="text-gray-600">
						{team?.description || "No description available"}
					</p>
					<p className="mt-2 text-sm text-gray-500">
						Team ID: {team_id}
					</p>
				</div>

				<h2 className="text-2xl font-bold text-red-800 mb-6">
					Team Members
				</h2>
				<div className="space-y-4">{renderPositions()}</div>
			</main>
		</div>
	);
}
