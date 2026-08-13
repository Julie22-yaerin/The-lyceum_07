import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function baseProps(props: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
  };
}

export function FlameIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 12v6a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 18v-6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function ReelsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="2.5" y="5" width="19" height="14" rx="3" />
      <path d="M9.5 9v6l5-3-5-3z" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-7z" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.5 5A3.54 3.54 0 0 1 17.5 10l-1.5 1.5" />
      <path d="M13 17.5 11.5 19A3.54 3.54 0 0 1 6.5 14l1.5-1.5" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
      <path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4.5 12 20 4.5 15 19.5l-4-6.5-6.5-1z" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 20.5s-7.5-4.6-9.8-9.3C.7 7.8 2.3 4.5 5.6 3.9c2-.4 3.9.5 5 2.2 1.1-1.7 3-2.6 5-2.2 3.3.6 4.9 3.9 3.4 7.3-2.3 4.7-9.8 9.3-9.8 9.3z" />
    </svg>
  );
}

export function AwardIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
