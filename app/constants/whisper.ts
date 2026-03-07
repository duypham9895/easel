import { SOSOption } from '@/types';

export const WHISPER_OPTIONS: Record<string, SOSOption[]> = {
  menstrual: [
    {
      id: 'whisper_hug',
      title: 'Need a hug',
      icon: 'heart',
      color: '#FF5F7E',
      description: 'I need to be held right now.',
    },
    {
      id: 'warmth',
      title: 'Bring warmth',
      icon: 'thermometer',
      color: '#FF7043',
      description: 'Something warm please.',
    },
    {
      id: 'chocolate',
      title: 'Bring chocolate',
      icon: 'coffee',
      color: '#795548',
      description: 'I am craving something sweet.',
    },
    {
      id: 'whisper_quiet',
      title: 'Quiet time',
      icon: 'moon',
      color: '#546E7A',
      description: 'I need peace and quiet.',
    },
  ],
  follicular: [
    {
      id: 'plan',
      title: 'Plan something',
      icon: 'map',
      color: '#70D6FF',
      description: 'Surprise me with something fun.',
    },
    {
      id: 'cook',
      title: 'Cook together',
      icon: 'home',
      color: '#4CAF50',
      description: 'Cook something together tonight.',
    },
    {
      id: 'walk',
      title: 'Go for a walk',
      icon: 'navigation',
      color: '#26A69A',
      description: "Let's go outside.",
    },
    {
      id: 'movie',
      title: 'Movie night',
      icon: 'film',
      color: '#5C6BC0',
      description: "Let's watch something together.",
    },
  ],
  ovulatory: [
    {
      id: 'date',
      title: 'Date night',
      icon: 'star',
      color: '#FFB347',
      description: 'Take me somewhere nice.',
    },
    {
      id: 'compliment',
      title: 'Compliment me',
      icon: 'sun',
      color: '#FFC107',
      description: 'I need to hear something nice.',
    },
    {
      id: 'dance',
      title: 'Dance with me',
      icon: 'music',
      color: '#FF4081',
      description: 'Put on a song and dance with me.',
    },
    {
      id: 'kiss',
      title: 'Kiss me',
      icon: 'heart',
      color: '#F06292',
      description: 'I just want a kiss.',
    },
  ],
  luteal: [
    {
      id: 'snacks',
      title: 'Bring snacks',
      icon: 'shopping-bag',
      color: '#4AD66D',
      description: 'Bring me my favourite snacks.',
    },
    {
      id: 'space',
      title: 'Give me space',
      icon: 'wind',
      color: '#90A4AE',
      description: 'I need some alone time.',
    },
    {
      id: 'cuddle',
      title: 'Cuddle me',
      icon: 'heart',
      color: '#CE93D8',
      description: 'Come cuddle with me.',
    },
    {
      id: 'kind',
      title: 'Kind words',
      icon: 'message-circle',
      color: '#80CBC4',
      description: 'Say something kind to me.',
    },
  ],
};
