"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TeamDetailPageClient({ team_id }) {
	const router = useRouter();
	const [team, setTeam] = useState(null);
	const [members, setMembers] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

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

				const { data: teamData, error: teamError } = await supabase
					.from("teams")
					.select("*")
					.eq("id", team_id)
					.single();

				if (teamError) throw teamError;
				setTeam(teamData);

				const { data: memberData, error: memberError } = await supabase
					.from("members")
					.select("user_id")
					.eq("team_id", team_id);

				if (memberError) throw memberError;
				const memberIds = memberData.map((member) => member.user_id);

				const { data: userData, error: userError } = await supabase
					.from("users")
					.select("id, first_name, last_name, interests")
					.in("id", memberIds);

				if (userError) throw userError;

				const formattedMembers = userData.map((m) => ({
					userId: m.id,
					username: `${m.first_name} ${m.last_name}`,
					skills: m.interests ? m.interests.split(",") : [],
				}));

				setMembers(formattedMembers);
			} catch (error) {
				console.error("Error fetching team details:", error);
				setTeam({
					id: team_id,
					name: `Example Team ${team_id}`,
					description: "Example team description",
					max_members: 5,
				});
			} finally {
				setIsLoading(false);
			}
		};

		if (team_id) fetchTeamDetails();
	}, [team_id]);

	const renderPositions = () => {
		return Array.from({ length: 5 }, (_, i) => {
			const member = members[i] || null;
			return (
				<div key={i} className="bg-white rounded-lg p-6 shadow mb-4">
					<h3 className="text-lg font-semibold text-red-800">
						Position {i + 1}
					</h3>
					{member ? (
						<div>
							<p className="font-medium">{member.username}</p>
							<p className="text-gray-600 mt-1">
								Skills:{" "}
								{member.skills.length > 0
									? member.skills.join(", ")
									: "No skills listed"}
							</p>
						</div>
					) : (
						<div className="flex items-center justify-center p-4 text-gray-400">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-8 w-8"
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
		});
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-sky-300 flex justify-center items-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-800"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-sky-300">
			<header className="bg-red-800">
				<nav className="container mx-auto flex justify-around px-4 py-4">
					<NavTab
						label="TEAMS"
						isActive={true}
						onClick={() => router.push("/teams")}
					/>
				</nav>
			</header>

			<main className="container mx-auto px-4 py-10">
				<button
					onClick={() => router.push("/teams")}
					className="flex items-center text-red-800 font-medium"
				>
					&lt; Back to Teams
				</button>

				<div className="bg-white rounded-xl p-8 shadow-lg mb-8">
					<h1 className="text-3xl font-bold text-red-800 mb-2">
						{team?.name || "Team"}
					</h1>
					<p className="text-gray-600">
						{team?.description || "No description available"}
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
