import { RouterProvider } from 'react-router';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { router } from '@/router/routes';

export default function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  );
}
