export interface MagicDialogue {
  name: string;
  text: string;
}

export interface MagicEmoji {
  name: string;
  url: string;
}

export enum AvatarPosition {
  LEFT = "left",
  RIGHT = "right",
}

export interface MagicAvatar {
  name: string;
  url: string;
  position: AvatarPosition;
}
