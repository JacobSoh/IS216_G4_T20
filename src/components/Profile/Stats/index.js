import { Badge } from "@/components/ui/badge";

export default function Stats({ title, number }) {
  return (
    <Badge variant='brand'>
      {number} {title}
    </Badge>
  );
};