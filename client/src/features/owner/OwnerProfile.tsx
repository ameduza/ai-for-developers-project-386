import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Owner } from '@/lib/api/generated';

interface OwnerProfileProps {
  owner: Owner | undefined;
  isLoading: boolean;
}

export function OwnerProfile({ owner, isLoading }: OwnerProfileProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-muted-foreground'>
            Loading profile...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!owner) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <p className='text-sm text-destructive'>Could not load profile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{owner.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground'>{owner.bio}</p>
      </CardContent>
    </Card>
  );
}
