import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const navigate = useNavigate();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    navigate("/login");
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {token ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">You are logged in.</p>
                <p className="text-sm">Token present in local storage.</p>
              </div>
              <Button variant="destructive" onClick={handleLogout}>Log out</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">You are not logged in.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


