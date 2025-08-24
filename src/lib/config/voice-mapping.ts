
export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';


export type VoiceColor = 'color-1' | 'color-2' | 'color-3' | 'color-4';


export interface VoiceConfig {
 waveForm: WaveformType;
 color: VoiceColor;
}


export const defaultVoice = 'Charon';


export const VOICE_MAPPING = {
 Charon: {
   waveForm: 'sine',
   color: 'color-1'
 },
 Aoede: {
   waveForm: 'square',
   color: 'color-2'
 },
 Fenrir: {
   waveForm: 'triangle',
   color: 'color-3'
 },
 Kore: {
   waveForm: 'sine',
   color: 'color-2'
 },
 Puck: {
   waveForm: 'square',
   color: 'color-1'
 },
 Marvin: {
   waveForm: 'square',
   color: 'color-1'
 }
} as const;


export type VoiceKey = keyof typeof VOICE_MAPPING;
