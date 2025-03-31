
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DifficultySelectorProps {
  maxQuestions: number;
  onChange: (settings: { easy: number; medium: number; hard: number }) => void;
}

const DifficultySelector = ({ maxQuestions, onChange }: DifficultySelectorProps) => {
  const [easy, setEasy] = useState(Math.floor(maxQuestions * 0.3)); // 30% easy by default
  const [medium, setMedium] = useState(Math.floor(maxQuestions * 0.5)); // 50% medium by default
  const [hard, setHard] = useState(maxQuestions - Math.floor(maxQuestions * 0.3) - Math.floor(maxQuestions * 0.5)); // Remaining as hard
  
  const handleEasyChange = (value: number[]) => {
    const newEasy = value[0];
    const remaining = maxQuestions - newEasy - hard;
    if (remaining >= 0) {
      setEasy(newEasy);
      setMedium(remaining);
      onChange({ easy: newEasy, medium: remaining, hard });
    }
  };
  
  const handleMediumChange = (value: number[]) => {
    const newMedium = value[0];
    const remaining = maxQuestions - easy - newMedium;
    if (remaining >= 0) {
      setMedium(newMedium);
      setHard(remaining);
      onChange({ easy, medium: newMedium, hard: remaining });
    }
  };
  
  const handleHardChange = (value: number[]) => {
    const newHard = value[0];
    const remaining = maxQuestions - easy - newHard;
    if (remaining >= 0) {
      setHard(newHard);
      setMedium(remaining);
      onChange({ easy, medium: remaining, hard: newHard });
    }
  };
  
  return (
    <Card className="border border-slate-200 dark:border-slate-700">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="flex items-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Easy Questions
            </Label>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{easy}</span>
          </div>
          <Slider 
            value={[easy]} 
            min={0} 
            max={maxQuestions} 
            step={1} 
            onValueChange={handleEasyChange} 
            className="[&_[role=slider]]:bg-emerald-500"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="flex items-center text-amber-600 dark:text-amber-400">
              <Award className="w-3 h-3 mr-1" />
              Medium Questions
            </Label>
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{medium}</span>
          </div>
          <Slider 
            value={[medium]} 
            min={0} 
            max={maxQuestions} 
            step={1} 
            onValueChange={handleMediumChange}
            className="[&_[role=slider]]:bg-amber-500"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="flex items-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-3 h-3 mr-1" />
              Hard Questions
            </Label>
            <span className="text-sm font-medium text-rose-600 dark:text-rose-400">{hard}</span>
          </div>
          <Slider 
            value={[hard]} 
            min={0} 
            max={maxQuestions} 
            step={1} 
            onValueChange={handleHardChange}
            className="[&_[role=slider]]:bg-rose-500"
          />
        </div>
        
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            Total: {easy + medium + hard} questions
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DifficultySelector;
