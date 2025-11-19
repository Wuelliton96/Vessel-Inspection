import React from 'react';
import styled from 'styled-components';
import { CheckCircle } from 'lucide-react';

const ProgressContainer = styled.div`
  margin-bottom: 2rem;
`;

const StepsList = styled.div`
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-bottom: 1rem;
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    height: 2px;
    background: #e5e7eb;
    z-index: 0;
  }
`;

const Step = styled.div<{ completed: boolean; active: boolean }>`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
`;

const StepCircle = styled.div<{ completed: boolean; active: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => 
    props.completed ? '#10b981' : 
    props.active ? '#3b82f6' : 
    '#e5e7eb'
  };
  color: ${props => 
    props.completed || props.active ? 'white' : 
    '#9ca3af'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  box-shadow: ${props => 
    props.active ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 
    'none'
  };
`;

const StepLabel = styled.div<{ active: boolean }>`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? '#3b82f6' : '#6b7280'};
  text-align: center;
  max-width: 100px;
`;

const ProgressLine = styled.div<{ progress: number }>`
  position: absolute;
  top: 20px;
  left: 0;
  height: 2px;
  background: #3b82f6;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
  z-index: 1;
`;

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; icon?: React.ReactNode }>;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, steps }) => {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <ProgressContainer>
      <StepsList>
        <ProgressLine progress={progress} />
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const completed = stepNumber < currentStep;
          const active = stepNumber === currentStep;

          return (
            <Step key={index} completed={completed} active={active}>
              <StepCircle completed={completed} active={active}>
                {completed ? (
                  <CheckCircle size={20} />
                ) : step.icon ? (
                  step.icon
                ) : (
                  stepNumber
                )}
              </StepCircle>
              <StepLabel active={active}>
                {step.label}
              </StepLabel>
            </Step>
          );
        })}
      </StepsList>
      <div style={{ 
        textAlign: 'center', 
        fontSize: '0.875rem', 
        color: '#6b7280',
        marginTop: '0.5rem'
      }}>
        Etapa {currentStep} de {totalSteps}
      </div>
    </ProgressContainer>
  );
};

export default ProgressBar;

