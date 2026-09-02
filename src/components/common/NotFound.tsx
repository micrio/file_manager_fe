import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../ui/button';
import { Label } from '../ui/label';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <Label className="text-[100px] mt-[-200px]">Not Found</Label>
      <Button className="w-40" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-10" /> Go back
      </Button>
    </div>
  );
};

export default NotFound;
