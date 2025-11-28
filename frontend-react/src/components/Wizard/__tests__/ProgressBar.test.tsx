import React from 'react';
import { render, screen } from '@testing-library/react';
import ProgressBar from '../ProgressBar';
import { CheckCircle } from 'lucide-react';

describe('ProgressBar', () => {
  const defaultSteps = [
    { label: 'Step 1' },
    { label: 'Step 2' },
    { label: 'Step 3' },
  ];

  it('deve renderizar barra de progresso com steps', () => {
    render(<ProgressBar currentStep={1} totalSteps={3} steps={defaultSteps} />);

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('deve mostrar step atual como ativo', () => {
    render(<ProgressBar currentStep={2} totalSteps={3} steps={defaultSteps} />);

    const step2 = screen.getByText('Step 2').closest('div');
    expect(step2).toBeInTheDocument();
  });

  it('deve mostrar steps anteriores como completos', () => {
    render(<ProgressBar currentStep={3} totalSteps={3} steps={defaultSteps} />);

    // Verificar que CheckCircle é renderizado para steps completos
    const checkCircles = screen.getAllByRole('img', { hidden: true });
    expect(checkCircles.length).toBeGreaterThan(0);
  });

  it('deve mostrar número do step quando não está completo', () => {
    render(<ProgressBar currentStep={1} totalSteps={3} steps={defaultSteps} />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('deve mostrar ícone customizado quando fornecido', () => {
    const stepsWithIcon = [
      { label: 'Step 1', icon: <span data-testid="custom-icon">Icon</span> },
      { label: 'Step 2' },
    ];

    render(<ProgressBar currentStep={1} totalSteps={2} steps={stepsWithIcon} />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('deve mostrar progresso correto', () => {
    render(<ProgressBar currentStep={2} totalSteps={4} steps={defaultSteps} />);

    expect(screen.getByText('Etapa 2 de 4')).toBeInTheDocument();
  });

  it('deve calcular progresso corretamente para primeiro step', () => {
    render(<ProgressBar currentStep={1} totalSteps={3} steps={defaultSteps} />);

    expect(screen.getByText('Etapa 1 de 3')).toBeInTheDocument();
  });

  it('deve calcular progresso corretamente para último step', () => {
    render(<ProgressBar currentStep={3} totalSteps={3} steps={defaultSteps} />);

    expect(screen.getByText('Etapa 3 de 3')).toBeInTheDocument();
  });

  it('deve renderizar com múltiplos steps', () => {
    const manySteps = [
      { label: 'Step 1' },
      { label: 'Step 2' },
      { label: 'Step 3' },
      { label: 'Step 4' },
      { label: 'Step 5' },
    ];

    render(<ProgressBar currentStep={3} totalSteps={5} steps={manySteps} />);

    manySteps.forEach(step => {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    });

    expect(screen.getByText('Etapa 3 de 5')).toBeInTheDocument();
  });
});

