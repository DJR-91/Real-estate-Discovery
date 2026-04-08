import {Content, Part, Tool} from '@google/generative-ai';

export interface LiveConfig {
  url: string;
  runId: string;
  userId: string;
}

export type StreamingLog = {
  date: Date;
  type: string;
  message:
    | string
    | object
    | RealtimeInputMessage
    | ToolResponseMessage
    | ClientContentMessage
    | ToolCall;
};

// incoming message
export type LiveIncomingMessage =
  | ServerContentMessage
  | ToolCallMessage
  | SetupCompleteMessage
  | ToolCallCancellationMessage;

// outgoing message
export type LiveOutgoingMessage =
  | RealtimeInputMessage
  | ToolResponseMessage
  | ClientContentMessage;

export type ServerContent = ModelTurn | Interrupted | TurnComplete;

export type RealtimeInputMessage = {
  realtimeInput: {
    mediaChunks: {
      data: string;
      mimeType: string;
    }[];
  };
};

export type ServerContentMessage = {
  serverContent: ServerContent;
};

export type ModelTurn = {
  modelTurn: Content;
};
export const isModelTurn = (obj: any): obj is ModelTurn => {
  return typeof obj === 'object' && obj?.modelTurn;
};

export type TurnComplete = {
  turnComplete: true;
};

export const isTurnComplete = (obj: any): obj is TurnComplete => {
t
  return typeof obj === 'object' && obj?.turnComplete;
};

export type Interrupted = {
  interrupted: true;
};
export const isInterrupted = (obj: any): obj is Interrupted => {
  return typeof obj === 'object' && obj?.interrupted;
};

export type SetupCompleteMessage = {
  setupComplete: true;
};
export const isSetupCompleteMessage = (
  obj: any
): obj is SetupCompleteMessage => {
  return typeof obj === 'object' && obj?.setupComplete;
};

export type ToolCallMessage = {
  toolCall: ToolCall;
};
export type ToolCall = {
  name: string;
  id: string;
  args: any;
};
export const isToolCallMessage = (obj: any): obj is ToolCallMessage => {
  return typeof obj === 'object' && obj?.toolCall;
};

export type ToolCallCancellation = {
  id: string;
  reason: string;
};
export type ToolCallCancellationMessage = {
  toolCallCancellation: ToolCallCancellation;
};
export const isToolCallCancellationMessage = (
  obj: any
): obj is ToolCallCancellationMessage => {
  return typeof obj === 'object' && obj?.toolCallCancellation;
};
export const isServerContenteMessage = (
  obj: any
): obj is ServerContentMessage => {
  return typeof obj === 'object' && obj?.serverContent;
};

export type ClientContentMessage = {
  clientContent: {
    turns: Content[];
    turnComplete: boolean;
  };
};

export type ToolResponseMessage = {
  toolResponse: {
    id: string;
    result: any;
  };
};
