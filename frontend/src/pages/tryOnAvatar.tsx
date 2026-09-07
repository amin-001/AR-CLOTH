import { Button } from "@/components/ui/button";
import { Navigate, useNavigate } from "react-router-dom";

const TryOnAvatar = () => {

    const navigate = useNavigate();

    return <div className="h-full w-full flex items-center justify-center">
        <Button 
        onClick={() => navigate('/avatar-canvas')}>Try On Avatar</Button>
    </div>;
};

export default TryOnAvatar;

