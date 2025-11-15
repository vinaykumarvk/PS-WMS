import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, MapPin, Calendar, Briefcase, Home, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PersonalInfoFormData {
  // Basic Details
  fullName: string;
  initials: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  anniversaryDate: string;
  
  // Contact Preferences
  preferredContactMethod: string;
  preferredContactTime: string;
  communicationFrequency: string;
  
  // Home Address
  homeAddress: string;
  homeCity: string;
  homeState: string;
  homePincode: string;
  
  // Work Address
  workAddress: string;
  workCity: string;
  workState: string;
  workPincode: string;
  
  // Professional Information
  profession: string;
  sectorOfEmployment: string;
  designation: string;
  companyName: string;
  annualIncome: string;
  workExperience: string;
}

interface PersonalInfoFormProps {
  onSubmit: (data: PersonalInfoFormData) => void | Promise<void>;
  onSaveDraft?: (data: PersonalInfoFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialValues?: Partial<PersonalInfoFormData>;
}

export function PersonalInfoForm({ onSubmit, onSaveDraft, onCancel, isLoading = false, initialValues }: PersonalInfoFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PersonalInfoFormData>({
    fullName: "",
    initials: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    anniversaryDate: "",
    preferredContactMethod: "",
    preferredContactTime: "",
    communicationFrequency: "",
    homeAddress: "",
    homeCity: "",
    homeState: "",
    homePincode: "",
    workAddress: "",
    workCity: "",
    workState: "",
    workPincode: "",
    profession: "",
    sectorOfEmployment: "",
    designation: "",
    companyName: "",
    annualIncome: "",
    workExperience: "",
  });

  useEffect(() => {
    if (initialValues) {
      setFormData(prev => ({ ...prev, ...initialValues } as PersonalInfoFormData));
    }
  }, [initialValues]);

  useEffect(() => {
    const handler = () => {
      if (onSaveDraft) onSaveDraft(formData);
    };
    // listen for custom event from parent
    const formEl = document.querySelector("form");
    if (formEl) formEl.addEventListener("save-draft" as any, handler as any);
    return () => {
      if (formEl) formEl.removeEventListener("save-draft" as any, handler as any);
    };
  }, [formData, onSaveDraft]);

  const [errors, setErrors] = useState<Partial<PersonalInfoFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<PersonalInfoFormData> = {};

    // Required fields validation
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (basic)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Anniversary date validation (only if married)
    if (formData.maritalStatus === "Married" && !formData.anniversaryDate) {
      newErrors.anniversaryDate = "Anniversary date is required for married clients";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setIsSubmitting(true);
        await onSubmit(formData);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to submit personal information";
        toast({ title: "Submission Failed", description: message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast({ title: "Validation Error", description: "Please fix the errors before submitting", variant: "destructive" });
    }
  };

  const handleInputChange = (field: keyof PersonalInfoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <p className="text-sm text-muted-foreground">Fill in the client's personal details. Fields marked with * are required.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Details Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Enter full name"
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initials">Initials</Label>
                  <Input
                    id="initials"
                    value={formData.initials}
                    onChange={(e) => handleInputChange("initials", e.target.value)}
                    placeholder="e.g., J.D."
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="client@example.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className={errors.dateOfBirth ? "border-red-500" : ""}
                  />
                  {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange("maritalStatus", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.maritalStatus === "Married" && (
                  <div className="space-y-2">
                    <Label htmlFor="anniversaryDate">Anniversary Date</Label>
                    <Input
                      id="anniversaryDate"
                      type="date"
                      value={formData.anniversaryDate}
                      onChange={(e) => handleInputChange("anniversaryDate", e.target.value)}
                      className={errors.anniversaryDate ? "border-red-500" : ""}
                    />
                    {errors.anniversaryDate && <p className="text-sm text-red-500">{errors.anniversaryDate}</p>}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact Preferences Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                  <Select value={formData.preferredContactMethod} onValueChange={(value) => handleInputChange("preferredContactMethod", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Phone">Phone</SelectItem>
                      <SelectItem value="In-person">In-person</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredContactTime">Preferred Contact Time</Label>
                  <Select value={formData.preferredContactTime} onValueChange={(value) => handleInputChange("preferredContactTime", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning (9 AM - 12 PM)</SelectItem>
                      <SelectItem value="Afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                      <SelectItem value="Evening">Evening (5 PM - 8 PM)</SelectItem>
                      <SelectItem value="Anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="communicationFrequency">Communication Frequency</Label>
                  <Select value={formData.communicationFrequency} onValueChange={(value) => handleInputChange("communicationFrequency", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Home Address Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home Address
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="homeAddress">Address</Label>
                  <Textarea
                    id="homeAddress"
                    value={formData.homeAddress}
                    onChange={(e) => handleInputChange("homeAddress", e.target.value)}
                    placeholder="Enter complete home address"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="homeCity">City</Label>
                    <Input
                      id="homeCity"
                      value={formData.homeCity}
                      onChange={(e) => handleInputChange("homeCity", e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homeState">State</Label>
                    <Input
                      id="homeState"
                      value={formData.homeState}
                      onChange={(e) => handleInputChange("homeState", e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homePincode">PIN Code</Label>
                    <Input
                      id="homePincode"
                      value={formData.homePincode}
                      onChange={(e) => handleInputChange("homePincode", e.target.value)}
                      placeholder="Enter PIN code"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Work Address Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Work Address
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workAddress">Address</Label>
                  <Textarea
                    id="workAddress"
                    value={formData.workAddress}
                    onChange={(e) => handleInputChange("workAddress", e.target.value)}
                    placeholder="Enter complete work address"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workCity">City</Label>
                    <Input
                      id="workCity"
                      value={formData.workCity}
                      onChange={(e) => handleInputChange("workCity", e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workState">State</Label>
                    <Input
                      id="workState"
                      value={formData.workState}
                      onChange={(e) => handleInputChange("workState", e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workPincode">PIN Code</Label>
                    <Input
                      id="workPincode"
                      value={formData.workPincode}
                      onChange={(e) => handleInputChange("workPincode", e.target.value)}
                      placeholder="Enter PIN code"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Professional Information Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => handleInputChange("profession", e.target.value)}
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => handleInputChange("designation", e.target.value)}
                    placeholder="e.g., Senior Manager"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sectorOfEmployment">Sector of Employment</Label>
                  <Select value={formData.sectorOfEmployment} onValueChange={(value) => handleInputChange("sectorOfEmployment", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Banking & Finance">Banking & Finance</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annualIncome">Annual Income</Label>
                  <Select value={formData.annualIncome} onValueChange={(value) => handleInputChange("annualIncome", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Less than 5 Lakhs">Less than ₹5 Lakhs</SelectItem>
                      <SelectItem value="5-10 Lakhs">₹5-10 Lakhs</SelectItem>
                      <SelectItem value="10-25 Lakhs">₹10-25 Lakhs</SelectItem>
                      <SelectItem value="25-50 Lakhs">₹25-50 Lakhs</SelectItem>
                      <SelectItem value="50 Lakhs - 1 Crore">₹50 Lakhs - ₹1 Crore</SelectItem>
                      <SelectItem value="Above 1 Crore">Above ₹1 Crore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workExperience">Work Experience (Years)</Label>
                  <Input
                    id="workExperience"
                    type="number"
                    value={formData.workExperience}
                    onChange={(e) => handleInputChange("workExperience", e.target.value)}
                    placeholder="Enter years of experience"
                    min="0"
                    max="50"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isSubmitting}>
                Cancel
              </Button>
              {onSaveDraft && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSaveDraft(formData)}
                  disabled={isLoading || isSubmitting}
                >
                  Save Draft
                </Button>
              )}
              <Button type="submit" disabled={isLoading || isSubmitting}>
                {isLoading || isSubmitting ? "Saving..." : "Save Personal Information"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
