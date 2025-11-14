import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Nominee } from '../types/order.types';
import { validatePAN, validateGuardianInfo, validateNomineePercentages } from '../utils/order-validations';

interface NomineeFormProps {
  value: Nominee[];
  onChange: (nominees: Nominee[]) => void;
  optOut: boolean;
  onOptOutChange: (optOut: boolean) => void;
}

export default function NomineeForm({ value, onChange, optOut, onOptOutChange }: NomineeFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addNominee = () => {
    const newNominee: Nominee = {
      id: `nominee-${Date.now()}`,
      name: '',
      relationship: '',
      dateOfBirth: '',
      pan: '',
      percentage: 0,
    };
    onChange([...value, newNominee]);
  };

  const removeNominee = (id: string) => {
    onChange(value.filter(n => n.id !== id));
    // Clear errors for removed nominee
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(id)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const updateNominee = (id: string, updates: Partial<Nominee>) => {
    const updated = value.map(n => n.id === id ? { ...n, ...updates } : n);
    onChange(updated);
    
    // Validate using validation utilities
    const newErrors = { ...errors };
    
    // Validate PAN format using utility
    if (updates.pan !== undefined) {
      const panValidation = validatePAN(updates.pan);
      if (!panValidation.isValid) {
        newErrors[`${id}-pan`] = panValidation.errors[0] || 'Invalid PAN format';
      } else {
        delete newErrors[`${id}-pan`];
      }
    }

    // Validate guardian info if nominee is minor
    if (updates.dateOfBirth || updates.guardianName || updates.guardianPan || updates.guardianRelationship) {
      const nominee = updated.find(n => n.id === id);
      if (nominee) {
        const guardianValidation = validateGuardianInfo(nominee);
        if (!guardianValidation.isValid) {
          guardianValidation.errors.forEach((err, idx) => {
            if (err.includes('Guardian name')) {
              newErrors[`${id}-guardianName`] = err;
            } else if (err.includes('Guardian PAN')) {
              newErrors[`${id}-guardianPan`] = err;
            } else if (err.includes('Guardian relationship')) {
              newErrors[`${id}-guardianRelationship`] = err;
            }
          });
        } else {
          delete newErrors[`${id}-guardianName`];
          delete newErrors[`${id}-guardianPan`];
          delete newErrors[`${id}-guardianRelationship`];
        }
      }
    }

    // Validate percentage total using utility
    const percentageValidation = validateNomineePercentages(updated);
    if (!percentageValidation.isValid) {
      newErrors.percentage = percentageValidation.errors[0] || 'Percentage must total 100%';
    } else {
      delete newErrors.percentage;
    }

    setErrors(newErrors);
  };

  // Validate on mount and when value changes
  useEffect(() => {
    if (value.length > 0 && !optOut) {
      const percentageValidation = validateNomineePercentages(value);
      if (!percentageValidation.isValid) {
        setErrors(prev => ({ ...prev, percentage: percentageValidation.errors[0] || 'Percentage must total 100%' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.percentage;
          return newErrors;
        });
      }
    }
  }, [value, optOut]);

  const isMinor = (dob: string): boolean => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    return age < 18 || (age === 18 && monthDiff < 0);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center space-x-2 sm:space-x-3 min-h-[44px] touch-manipulation">
        <Checkbox
          id="opt-out"
          checked={optOut}
          onCheckedChange={onOptOutChange}
          className="h-5 w-5"
          aria-label="Opt out of nomination"
        />
        <Label htmlFor="opt-out" className="cursor-pointer text-sm sm:text-base">
          Opt out of nomination
        </Label>
      </div>

      {!optOut && (
        <>
          {value.map((nominee, index) => {
            const minor = isMinor(nominee.dateOfBirth);
            return (
              <Card key={nominee.id} className="border-border">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Nominee {index + 1}</h4>
                    {value.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNominee(nominee.id)}
                        aria-label={`Remove nominee ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${nominee.id}-name`} className="text-sm sm:text-base">
                        Name <span className="text-destructive" aria-label="required">*</span>
                      </Label>
                      <Input
                        id={`${nominee.id}-name`}
                        value={nominee.name}
                        onChange={(e) => updateNominee(nominee.id, { name: e.target.value })}
                        aria-required="true"
                        aria-invalid={!nominee.name ? 'true' : 'false'}
                        className="min-h-[44px] text-base sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${nominee.id}-relationship`} className="text-sm sm:text-base">
                        Relationship <span className="text-destructive" aria-label="required">*</span>
                      </Label>
                      <Input
                        id={`${nominee.id}-relationship`}
                        value={nominee.relationship}
                        onChange={(e) => updateNominee(nominee.id, { relationship: e.target.value })}
                        aria-required="true"
                        aria-invalid={!nominee.relationship ? 'true' : 'false'}
                        className="min-h-[44px] text-base sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${nominee.id}-dob`} className="text-sm sm:text-base">
                        Date of Birth <span className="text-destructive" aria-label="required">*</span>
                      </Label>
                      <Input
                        id={`${nominee.id}-dob`}
                        type="date"
                        value={nominee.dateOfBirth}
                        onChange={(e) => updateNominee(nominee.id, { dateOfBirth: e.target.value })}
                        aria-required="true"
                        aria-invalid={!nominee.dateOfBirth ? 'true' : 'false'}
                        className="min-h-[44px] text-base sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${nominee.id}-pan`} className="text-sm sm:text-base">
                        PAN <span className="text-destructive" aria-label="required">*</span>
                      </Label>
                      <Input
                        id={`${nominee.id}-pan`}
                        value={nominee.pan}
                        onChange={(e) => updateNominee(nominee.id, { pan: e.target.value.toUpperCase() })}
                        maxLength={10}
                        aria-required="true"
                        aria-invalid={errors[`${nominee.id}-pan`] ? 'true' : 'false'}
                        aria-describedby={errors[`${nominee.id}-pan`] ? `${nominee.id}-pan-error` : undefined}
                        className="min-h-[44px] text-base sm:text-sm uppercase"
                      />
                      {errors[`${nominee.id}-pan`] && (
                        <p id={`${nominee.id}-pan-error`} className="text-xs sm:text-sm text-destructive mt-1" role="alert">
                          {errors[`${nominee.id}-pan`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${nominee.id}-percentage`} className="text-sm sm:text-base">
                        Percentage <span className="text-destructive" aria-label="required">*</span>
                      </Label>
                      <Input
                        id={`${nominee.id}-percentage`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={nominee.percentage}
                        onChange={(e) => updateNominee(nominee.id, { percentage: parseFloat(e.target.value) || 0 })}
                        aria-required="true"
                        aria-invalid={errors.percentage ? 'true' : 'false'}
                        aria-describedby={errors.percentage ? 'percentage-error' : undefined}
                        className="min-h-[44px] text-base sm:text-sm"
                      />
                    </div>
                  </div>

                  {minor && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-border">
                      <div className="space-y-2">
                        <Label htmlFor={`${nominee.id}-guardian-name`}>
                          Guardian Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`${nominee.id}-guardian-name`}
                          value={nominee.guardianName || ''}
                          onChange={(e) => updateNominee(nominee.id, { guardianName: e.target.value })}
                          aria-required="true"
                          aria-invalid={errors[`${nominee.id}-guardianName`] ? 'true' : 'false'}
                        />
                        {errors[`${nominee.id}-guardianName`] && (
                          <p className="text-sm text-destructive mt-1" role="alert">
                            {errors[`${nominee.id}-guardianName`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${nominee.id}-guardian-pan`}>
                          Guardian PAN <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`${nominee.id}-guardian-pan`}
                          value={nominee.guardianPan || ''}
                          onChange={(e) => updateNominee(nominee.id, { guardianPan: e.target.value.toUpperCase() })}
                          maxLength={10}
                          aria-required="true"
                          aria-invalid={errors[`${nominee.id}-guardianPan`] ? 'true' : 'false'}
                          aria-describedby={errors[`${nominee.id}-guardianPan`] ? `${nominee.id}-guardian-pan-error` : undefined}
                        />
                        {errors[`${nominee.id}-guardianPan`] && (
                          <p id={`${nominee.id}-guardian-pan-error`} className="text-sm text-destructive mt-1" role="alert">
                            {errors[`${nominee.id}-guardianPan`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${nominee.id}-guardian-relationship`}>
                          Guardian Relationship <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`${nominee.id}-guardian-relationship`}
                          value={nominee.guardianRelationship || ''}
                          onChange={(e) => updateNominee(nominee.id, { guardianRelationship: e.target.value })}
                          aria-required="true"
                          aria-invalid={errors[`${nominee.id}-guardianRelationship`] ? 'true' : 'false'}
                        />
                        {errors[`${nominee.id}-guardianRelationship`] && (
                          <p className="text-sm text-destructive mt-1" role="alert">
                            {errors[`${nominee.id}-guardianRelationship`]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {errors.percentage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md" role="alert" id="percentage-error">
              <p className="text-sm text-destructive font-medium">{errors.percentage}</p>
            </div>
          )}

          <Button 
            onClick={addNominee} 
            variant="outline"
            className="min-h-[44px] touch-manipulation w-full sm:w-auto"
            aria-label="Add another nominee"
          >
            <Plus className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
            Add Nominee
          </Button>
        </>
      )}
    </div>
  );
}

