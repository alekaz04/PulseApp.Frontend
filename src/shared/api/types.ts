export type ComplimentDto = {
  id: string;
  title: string;
  text: string;
  isBeenPushed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ComplimentInput = {
  title: string;
  text: string;
};

/** PUT на бэкенде требует все три поля */
export type ComplimentUpdate = ComplimentInput & {
  isBeenPushed: boolean;
};

export type MySubscriptionDto = {
  id: string;
  /** Имя из ссылки-приглашения. У старых подписок его нет, бэкенд может ещё не отдавать поле */
  name?: string | null;
  userAgent: string | null;
  createdAt: string;
  isActive: boolean;
};

export type SubscribeRequest = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent: string | null;
  inviteCode: string;
};

export type SubscribeResponse = {
  id: string;
  message: string;
};

export type UnsubscribeResponse = {
  success: boolean;
  message: string;
};

export type VapidResponse = {
  publicKey: string;
};
