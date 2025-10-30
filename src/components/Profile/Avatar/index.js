import Image from "next/image"
import { useState } from "react";

export default function Avatar({
  avatar_url,
  username
}) {
  const [e, setE] = useState(false);
  let className = `block w-20 h-20 rounded-full ring-3 ring-[var(--theme-secondary)] shadow-[0_0_20px_rgba(59,130,246,0.4)]
  ${e? 'flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 text-white text-3xl font-bold':'object-cover'}`;

  const handleError = (e) => setE(true);

  if (e) {
    //"w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 text-white text-3xl font-bold"
    return (
      <div className={className}>
        {username[0]?.toUpperCase() || "U"}
      </div>
    );
  };

  return <img src={avatar_url} alt={username} className={className} onError={handleError} />


  return 
    {avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={avatar_url}
            alt={username}
            className="w-20 h-20 rounded-full ring-4 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] object-cover"
        />
    ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 text-white text-3xl font-bold">
            {username[0]?.toUpperCase() || "U"}
        </div>
    )}
};