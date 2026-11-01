import { ParsedQuickEntry } from '../types';

export function parseQuickEntryText(text: string, selectedDate?: string): ParsedQuickEntry {
  const date = selectedDate || new Date().toISOString().split('T')[0];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const parsed: ParsedQuickEntry = {
    rawText: text,
    date,
    journalStory: text,
    fitness: {
      cardio: [],
      exercises: [],
      meals: [],
    },
    career: {
      tasksDone: [],
      achievements: [],
      meetings: [],
      skillsLearned: [],
      mistakes: [],
      leadership: [],
    },
    finance: {
      expenses: [],
      income: [],
    },
    habitsToggled: [],
    learning: [],
    mood: {
      gratitude: [],
    },
  };

  // --- 1. Wake up & Sleep Times ---
  const wakeUpMatch = text.match(/(?:woke\s*up(?:\s*at)?|wake(?:\s*up)?|waking\s*up)\s*(?:at\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (wakeUpMatch) {
    parsed.wakeUpTime = normalizeTime(wakeUpMatch[1]);
  }

  const sleepMatch = text.match(/(?:slept(?:\s*at)?|sleep(?:\s*at)?|bedtime|went\s*to\s*bed(?:\s*at)?)\s*(?:at\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (sleepMatch) {
    parsed.sleepTime = normalizeTime(sleepMatch[1]);
  }

  // --- 2. Water Intake ---
  const waterLMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:l|liter|litres|liters)\s*(?:of\s*)?water/i) ||
                     text.match(/water(?:\s*intake)?[:\s]+(\d+(?:\.\d+)?)\s*(?:l|liter|litres|liters)/i);
  if (waterLMatch) {
    parsed.fitness!.waterMl = Math.round(parseFloat(waterLMatch[1]) * 1000);
  } else {
    const waterMlMatch = text.match(/(\d{3,4})\s*ml\s*(?:of\s*)?water/i) ||
                        text.match(/water[:\s]+(\d{3,4})\s*ml/i);
    if (waterMlMatch) {
      parsed.fitness!.waterMl = parseInt(waterMlMatch[1], 10);
    }
  }

  // --- 3. Steps ---
  const stepsMatch = text.match(/(\d{1,3}(?:,\d{3})+|\d{3,5})\s*steps/i) ||
                     text.match(/walked\s*(\d{1,3}(?:,\d{3})+|\d{3,5})/i);
  if (stepsMatch) {
    const num = parseInt(stepsMatch[1].replace(/,/g, ''), 10);
    parsed.fitness!.steps = num;
  }

  // --- 4. Weight ---
  const weightMatch = text.match(/weight[:\s]+(\d{2,3}(?:\.\d+)?)\s*(?:kg|lbs)?/i) ||
                      text.match(/weighed\s*(\d{2,3}(?:\.\d+)?)\s*(?:kg|lbs)?/i);
  if (weightMatch) {
    parsed.fitness!.weight = parseFloat(weightMatch[1]);
  }

  // --- 5. Cardio ---
  const runMatch = text.match(/(?:ran|run|jogged|jog|walking|walked|cycled|cycling|swim|swimming)\s*(\d+(?:\.\d+)?)\s*km(?:\s*in\s*(\d+)\s*(?:mins?|minutes?))?/i);
  if (runMatch) {
    const act = text.toLowerCase().includes('cycl') ? 'Cycling' : text.toLowerCase().includes('swim') ? 'Swimming' : text.toLowerCase().includes('walk') ? 'Walking' : 'Running';
    parsed.fitness!.cardio!.push({
      type: act,
      distanceKm: parseFloat(runMatch[1]),
      durationMin: runMatch[2] ? parseInt(runMatch[2], 10) : 30,
    });
  }

  // --- 6. Gym Exercises ---
  const gymBlockMatch = text.match(/(?:gym|workout|lifting|exercises?)[:\s]+([^\n.]+)/i);
  if (gymBlockMatch) {
    const items = gymBlockMatch[1].split(/[,;]/);
    for (const item of items) {
      const match = item.trim().match(/([a-zA-Z\s]+?)\s*(\d+(?:\.\d+)?\s*kg)?\s*(\d+)\s*[xX]\s*(\d+)/);
      if (match) {
        const name = match[1].trim();
        const weight = match[2] ? parseFloat(match[2]) : 0;
        const sets = parseInt(match[3], 10);
        const reps = parseInt(match[4], 10);
        parsed.fitness!.exercises!.push({
          name,
          sets,
          reps,
          weightKg: weight,
        });
      } else if (item.trim().length > 3) {
        parsed.fitness!.exercises!.push({
          name: item.trim(),
          sets: 3,
          reps: 10,
          weightKg: 0,
        });
      }
    }
  }

  // --- 7. Meals & Nutrition ---
  const mealRegex = /(breakfast|lunch|dinner|snack|meal)[:\s]+([^.,\n]+)(?:[,\s]+(\d+)\s*kcal)?(?:[,\s]+(\d+)\s*g\s*protein)?/gi;
  let mealMatch;
  while ((mealMatch = mealRegex.exec(text)) !== null) {
    const food = mealMatch[2].trim();
    const cals = mealMatch[3] ? parseInt(mealMatch[3], 10) : undefined;
    const prot = mealMatch[4] ? parseInt(mealMatch[4], 10) : undefined;
    parsed.fitness!.meals!.push({
      food: `${mealMatch[1].toUpperCase()}: ${food}`,
      calories: cals || 450,
      proteinG: prot || 25,
    });
  }

  // --- 8. Finance Expenses / Income ---
  // Matches "$15 on coffee" or "spent $30 on lunch" or "paid 50 for uber"
  const expenseRegex = /(?:spent|paid|bought|expense|cost)\s*[$€£]?\s*(\d+(?:\.\d{2})?)\s*(?:on|for)?\s*([^,\n.]+)/gi;
  let expMatch;
  while ((expMatch = expenseRegex.exec(text)) !== null) {
    const amount = parseFloat(expMatch[1]);
    const desc = expMatch[2].trim();
    parsed.finance!.expenses!.push({
      category: categorizeExpense(desc),
      amount,
      notes: desc,
    });
  }

  // Matches "received $2000" or "salary $3000"
  const incomeRegex = /(?:received|earned|income|salary)\s*[$€£]?\s*(\d+(?:\.\d{2})?)\s*(?:from|for)?\s*([^,\n.]*)/gi;
  let incMatch;
  while ((incMatch = incomeRegex.exec(text)) !== null) {
    const amount = parseFloat(incMatch[1]);
    const desc = incMatch[2].trim() || 'Salary / Work';
    parsed.finance!.income!.push({
      category: 'Income',
      amount,
      notes: desc,
    });
  }

  // --- 9. Habits Detection ---
  const lower = text.toLowerCase();
  if (lower.includes('gym') || lower.includes('workout') || lower.includes('lifted')) {
    parsed.habitsToggled!.push('habit_gym');
  }
  if (lower.includes('early') || (parsed.wakeUpTime && parsed.wakeUpTime <= '07:00')) {
    parsed.habitsToggled!.push('habit_wake_early');
  }
  if (lower.includes('read') || lower.includes('pages') || lower.includes('chapter') || lower.includes('book')) {
    parsed.habitsToggled!.push('habit_reading');
  }
  if (lower.includes('english') || lower.includes('vocabulary') || lower.includes('speaking')) {
    parsed.habitsToggled!.push('habit_english');
  }
  if (parsed.fitness?.waterMl && parsed.fitness.waterMl >= 2500) {
    parsed.habitsToggled!.push('habit_water');
  }
  if (lower.includes('sleep') && (parsed.sleepTime && parsed.sleepTime <= '23:00')) {
    parsed.habitsToggled!.push('habit_sleep');
  }

  // --- 10. Career Tasks, Achievements, Meetings ---
  lines.forEach((line) => {
    const l = line.toLowerCase();
    if (l.startsWith('task:') || l.startsWith('todo:') || l.startsWith('office:') || l.startsWith('work:')) {
      const content = line.replace(/^(task|todo|office|work):/i, '').trim();
      parsed.career!.tasksDone!.push(content);
    } else if (l.includes('achievement') || l.includes('achieved') || l.includes('won') || l.includes('closed deal')) {
      parsed.career!.achievements!.push(line);
    } else if (l.includes('meeting') || l.includes('1-on-1') || l.includes('standup') || l.includes('sprint')) {
      parsed.career!.meetings!.push(line);
    } else if (l.includes('learned') || l.includes('study') || l.includes('studied')) {
      if (l.includes('leadership') || l.includes('lead') || l.includes('manage')) {
        parsed.career!.leadership!.push(line);
        parsed.learning!.push({
          category: 'leadership',
          topic: 'Leadership Practice',
          notes: line,
        });
      } else if (l.includes('tech') || l.includes('code') || l.includes('react') || l.includes('sql') || l.includes('system') || l.includes('python')) {
        parsed.career!.skillsLearned!.push(line);
        parsed.learning!.push({
          category: 'technology',
          topic: 'Tech Skill',
          notes: line,
        });
      } else if (l.includes('english') || l.includes('phrase') || l.includes('word')) {
        parsed.learning!.push({
          category: 'english',
          topic: 'English Practice',
          notes: line,
        });
      } else if (l.includes('communication') || l.includes('talk') || l.includes('presentation')) {
        parsed.learning!.push({
          category: 'communication',
          topic: 'Communication Skills',
          notes: line,
        });
      }
    } else if (l.includes('mistake') || l.includes('failed') || l.includes('bug') || l.includes('learning:')) {
      parsed.career!.mistakes!.push(line);
    }
  });

  // --- 11. Mood, Energy, Stress, Gratitude ---
  if (lower.includes('great') || lower.includes('awesome') || lower.includes('fantastic') || lower.includes('energetic')) {
    parsed.mood!.score = 5;
    parsed.mood!.energy = 5;
    parsed.mood!.stress = 1;
  } else if (lower.includes('good') || lower.includes('productive') || lower.includes('fine')) {
    parsed.mood!.score = 4;
    parsed.mood!.energy = 4;
    parsed.mood!.stress = 2;
  } else if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('stressed')) {
    parsed.mood!.score = 2;
    parsed.mood!.energy = 2;
    parsed.mood!.stress = 4;
  } else {
    parsed.mood!.score = 4; // balanced default
    parsed.mood!.energy = 3;
    parsed.mood!.stress = 2;
  }

  // Gratitude
  const gratitudeMatch = text.match(/(?:grateful\s*for|gratitude)[:\s]+([^.\n]+)/i);
  if (gratitudeMatch) {
    const items = gratitudeMatch[1].split(/[,;]|and/).map((s) => s.trim()).filter(Boolean);
    parsed.mood!.gratitude = items.slice(0, 3);
  }

  return parsed;
}

function normalizeTime(timeStr: string): string {
  const clean = timeStr.trim().toLowerCase();
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');
  const numbersOnly = clean.replace(/[^\d:]/g, '');
  const parts = numbersOnly.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function categorizeExpense(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('food') || d.includes('coffee') || d.includes('lunch') || d.includes('dinner') || d.includes('breakfast') || d.includes('grocer') || d.includes('snack') || d.includes('restaurant')) {
    return 'Food & Dining';
  }
  if (d.includes('uber') || d.includes('cab') || d.includes('gas') || d.includes('train') || d.includes('flight') || d.includes('transit') || d.includes('parking')) {
    return 'Transportation';
  }
  if (d.includes('rent') || d.includes('electric') || d.includes('utility') || d.includes('wifi') || d.includes('internet') || d.includes('water bill')) {
    return 'Housing & Utilities';
  }
  if (d.includes('gym') || d.includes('protein') || d.includes('supplement') || d.includes('doctor') || d.includes('med') || d.includes('pharmacy')) {
    return 'Health & Fitness';
  }
  if (d.includes('tech') || d.includes('app') || d.includes('software') || d.includes('hardware') || d.includes('gadget') || d.includes('laptop')) {
    return 'Technology';
  }
  if (d.includes('movie') || d.includes('game') || d.includes('book') || d.includes('concert') || d.includes('fun')) {
    return 'Leisure & Entertainment';
  }
  return 'Personal';
}
