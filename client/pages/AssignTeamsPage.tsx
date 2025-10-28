import React, { useState, useMemo } from 'react';
import { Users, AlertTriangle, Map, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label"; // Assuming Label is available

// --- MOCK DATA/TYPES (In a real app, this would be fetched from the backend) ---

type IncidentStatus = "Pending Assignment" | "Acknowledged" | "Resolved";
type Severity = "Critical" | "Warning" | "Info";

interface Incident {
    id: string;
    type: string;
    severity: Severity;
    location: string;
    reportedAt: string;
    status: IncidentStatus;
    assignedTeam: string | null;
}

interface Team {
    id: string;
    name: string;
    status: "Available" | "Deployed" | "On Standby";
    location?: string; // Last known location
}

// Initial set of incidents (some pending, some already acknowledged)
const MOCK_INCIDENTS: Incident[] = [
    { id: "INC-1025", type: "Landslide", severity: "Critical", location: "Ooty Hills", reportedAt: "5m ago", status: "Pending Assignment", assignedTeam: null },
    { id: "INC-1023", type: "Flood", severity: "Critical", location: "Kochi, KL", reportedAt: "16m ago", status: "Pending Assignment", assignedTeam: null },
    { id: "INC-1024", type: "Cyclone", severity: "Warning", location: "Bay of Bengal", reportedAt: "5m ago", status: "Acknowledged", assignedTeam: "Coast Guard Unit 1" },
];

// Initial set of response teams
const MOCK_TEAMS: Team[] = [
    { id: "t1", name: "NDRF Unit Alpha", status: "Available", location: "Chennai Depot" },
    { id: "t2", name: "Fire & Rescue Team", status: "Available", location: "Local Station 4" },
    { id: "t3", name: "Coast Guard Unit 1", status: "Deployed", location: "Bay of Bengal" },
    { id: "t4", name: "Local Police Task", status: "On Standby", location: "HQ" },
];

// --- MAIN COMPONENT ---

export default function AssignTeamsPage() {
    const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
    const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    const availableTeams = teams.filter(t => t.status === 'Available');
    const pendingIncidents = incidents.filter(i => i.status === 'Pending Assignment');
    
    // Find the currently selected incident for display
    const selectedIncident = useMemo(() => 
        incidents.find(i => i.id === selectedIncidentId), 
        [selectedIncidentId, incidents]
    );

    const handleAssign = async () => {
        if (!selectedIncidentId || !selectedTeamId) {
            alert("Please select both an incident and an available team.");
            return;
        }

        const teamName = teams.find(t => t.id === selectedTeamId)?.name;
        if (!teamName) return;

        // 1. **MOCK Backend Update:** Simulate API call to assign the team
        // In a real app, this is where you would call: 
        // await fetch('/api/dispatch/assign', { method: 'POST', body: JSON.stringify({...}) });
        await new Promise(resolve => setTimeout(resolve, 500)); 

        // 2. Update Local Incident State (UI)
        setIncidents(prev => 
            prev.map(i => 
                i.id === selectedIncidentId
                ? { ...i, assignedTeam: teamName, status: "Acknowledged" } // Set status to acknowledged upon assignment
                : i
            )
        );
        
        // 3. Update Local Team State (Mark team as deployed)
        setTeams(prev => 
            prev.map(t => 
                t.id === selectedTeamId
                ? { ...t, status: "Deployed" }
                : t
            )
        );
        
        // 4. Cleanup
        alert(`✅ Team ${teamName} successfully dispatched to incident ${selectedIncidentId}!`);
        setSelectedIncidentId(null);
        setSelectedTeamId(null);
    };
    
    const getSeverityBadge = (severity: Severity) => {
        switch (severity) {
            case 'Critical': return <Badge variant="destructive">Critical</Badge>;
            case 'Warning': return <Badge variant="secondary" className="bg-yellow-500 text-black">Warning</Badge>;
            case 'Info': return <Badge variant="outline">Info</Badge>;
            default: return <Badge variant="outline">{severity}</Badge>;
        }
    };


    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6 text-sky-700" /> Assign Response Teams
                    </h1>
                    <p className="text-sm text-muted-foreground">Focus on dispatching available resources to pending incidents.</p>
                </div>
                {/* Optional: Button to return to the main dashboard */}
                {/* <Button onClick={() => navigate('/authorities')} variant="outline">Back to Dashboard</Button> */}
            </div>

            {/* --- Assignment Panel --- */}
            <Card className="border-sky-500/50 bg-sky-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        Dispatch Console
                    </CardTitle>
                    <CardDescription>
                        Follow the steps below to select an incident, choose an available team, and confirm the dispatch.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    {/* Column 1: Incident Selection */}
                    <div className="space-y-3 border-r pr-6">
                        <Label htmlFor="incident-select" className="font-semibold">1. Select Incident</Label>
                        <Select onValueChange={setSelectedIncidentId} value={selectedIncidentId || ""}>
                            <SelectTrigger id="incident-select">
                                <SelectValue placeholder={`Select one of ${pendingIncidents.length} Pending Incidents`} />
                            </SelectTrigger>
                            <SelectContent>
                                {/* List Pending Incidents first */}
                                {pendingIncidents.map((inc) => (
                                    <SelectItem key={inc.id} value={inc.id}>
                                        {inc.id} - {inc.type} - {inc.location}
                                    </SelectItem>
                                ))}
                                {/* List Acknowledged Incidents for potential re-assignment */}
                                {incidents.filter(i => i.status === 'Acknowledged').map((inc) => (
                                     <SelectItem key={inc.id} value={inc.id} className="text-muted-foreground italic">
                                        {inc.id} - {inc.type} ({inc.assignedTeam} - Reassign)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        {selectedIncident && (
                            <div className="mt-3 p-3 border rounded-md bg-white">
                                <p className="font-medium text-sm">Details for {selectedIncident.id}</p>
                                <p className="text-xs text-muted-foreground">
                                    Type: {selectedIncident.type} • Severity: {selectedIncident.severity}
                                </p>
                                <p className="text-xs text-muted-foreground">Location: {selectedIncident.location}</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Column 2: Team Selection */}
                    <div className="space-y-3 border-r pr-6">
                        <Label htmlFor="team-select" className="font-semibold">2. Select Team ({availableTeams.length} Available)</Label>
                        <Select onValueChange={setSelectedTeamId} value={selectedTeamId || ""}>
                            <SelectTrigger id="team-select">
                                <SelectValue placeholder="Choose an Available Response Unit" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTeams.map((team) => (
                                    <SelectItem key={team.id} value={team.id}>
                                        {team.name} ({team.location})
                                    </SelectItem>
                                ))}
                                {/* Teams currently deployed (greyed out) */}
                                {teams.filter(t => t.status === 'Deployed' || t.status === 'On Standby').map((team) => (
                                    <SelectItem key={team.id} value={team.id} disabled className="italic text-red-500">
                                        {team.name} ({team.status})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground pt-1">
                            Only 'Available' teams (Green) can be selected for a new dispatch.
                        </p>
                    </div>

                    {/* Column 3: Confirmation and Map */}
                    <div className="space-y-4 pt-4 md:pt-0">
                        <Label className="font-semibold">3. Confirm Dispatch</Label>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedIncidentId || !selectedTeamId}
                            className="w-full h-12 gap-2 text-lg"
                        >
                            <CheckCircle2 className="h-5 w-5" /> Confirm Assignment
                        </Button>
                        <Button variant="outline" className="w-full gap-2">
                            <Map className="h-4 w-4" /> View Map for Proximity Check
                        </Button>
                        <p className="text-xs text-muted-foreground text-center pt-2">
                            *Clicking 'Confirm' will update the status on the main dashboard.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* --- Team Status Overview Table --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Team Status Overview</CardTitle>
                    <CardDescription>Track the current location and deployment status of all response units.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Team Name</TableHead>
                                <TableHead>Current Status</TableHead>
                                <TableHead>Last Known Location</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teams.map((team) => (
                                <TableRow key={team.id} className={team.status === 'Available' ? 'bg-green-50/50' : team.status === 'Deployed' ? 'bg-red-50/50' : ''}>
                                    <TableCell className="font-medium">{team.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={team.status === 'Available' ? 'default' : team.status === 'Deployed' ? 'destructive' : 'secondary'}>
                                            {team.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{team.location || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost">View Details</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}