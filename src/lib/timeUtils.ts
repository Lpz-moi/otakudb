/**
 * Utilitaires pour la conversion horaire JST -> France
 */

// Japan Standard Time offset (UTC+9)
const JST_OFFSET = 9;

// France timezone (CET = UTC+1, CEST = UTC+2)
const getFranceOffset = (date: Date): number => {
  // Check if DST is active (last Sunday of March to last Sunday of October)
  const year = date.getFullYear();
  const marchLastSunday = getLastSundayOfMonth(year, 2);
  const octoberLastSunday = getLastSundayOfMonth(year, 9);
  
  if (date >= marchLastSunday && date < octoberLastSunday) {
    return 2; // CEST
  }
  return 1; // CET
};

const getLastSundayOfMonth = (year: number, month: number): Date => {
  const date = new Date(year, month + 1, 0);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(2, 0, 0, 0); // DST changes at 2:00
  return date;
};

/**
 * Convertit une heure JST en heure française
 */
export const convertJSTToFrance = (jstTime: string): { time: string; offset: string } => {
  const now = new Date();
  const frOffset = getFranceOffset(now);
  
  // Parse JST time (format: "HH:MM" or "HH:MM:SS")
  const [hours, minutes] = jstTime.split(':').map(Number);
  
  // Calculate the difference
  const diffHours = frOffset - JST_OFFSET; // Usually -8 or -7
  
  let newHours = hours + diffHours;
  let dayOffset = 0;
  
  if (newHours < 0) {
    newHours += 24;
    dayOffset = -1;
  } else if (newHours >= 24) {
    newHours -= 24;
    dayOffset = 1;
  }
  
  const formattedTime = `${newHours.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}`;
  const offsetString = frOffset === 2 ? 'UTC+2' : 'UTC+1';
  
  return { time: formattedTime, offset: offsetString };
};

/**
 * Calcule le compte à rebours jusqu'à une date/heure donnée
 */
export const getCountdown = (targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isNear: boolean;
  isPast: boolean;
  label: string;
} => {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isNear: false, isPast: true, label: 'Disponible' };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  // Is near if less than 1 hour
  const isNear = diff < 60 * 60 * 1000;
  
  let label = '';
  if (days > 0) {
    label = `J-${days}`;
  } else if (hours > 0) {
    label = `${hours}h${minutes.toString().padStart(2, '0')}`;
  } else {
    label = `${minutes}min`;
  }
  
  return { days, hours, minutes, seconds, isNear, isPast: false, label };
};

/**
 * Formate une date pour affichage
 */
export const formatRelativeDay = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
};

/**
 * Obtient le nom du jour en français
 */
export const getDayName = (dayIndex: number): string => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayIndex];
};

/**
 * Obtient le nom court du jour
 */
export const getShortDayName = (dayIndex: number): string => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[dayIndex];
};

/**
 * Génère une date de diffusion à partir d'un jour et d'une heure
 */
export const getNextBroadcastDate = (dayName: string, time: string): Date => {
  const daysMap: Record<string, number> = {
    sunday: 0, sundays: 0,
    monday: 1, mondays: 1,
    tuesday: 2, tuesdays: 2,
    wednesday: 3, wednesdays: 3,
    thursday: 4, thursdays: 4,
    friday: 5, fridays: 5,
    saturday: 6, saturdays: 6,
  };
  
  const targetDay = daysMap[dayName.toLowerCase()] ?? 0;
  const now = new Date();
  const currentDay = now.getDay();
  
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0) {
    // Check if time has passed today
    const [hours, minutes] = time.split(':').map(Number);
    const targetTime = new Date(now);
    targetTime.setHours(hours, minutes, 0, 0);
    if (now > targetTime) {
      daysUntil = 7;
    }
  }
  
  const result = new Date(now);
  result.setDate(result.getDate() + daysUntil);
  
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    result.setHours(hours, minutes, 0, 0);
  }
  
  return result;
};
