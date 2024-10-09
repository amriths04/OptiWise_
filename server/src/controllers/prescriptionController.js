import { supabase } from '../db/supabaseClient.js';

const getPrescriptionIds = async (req, res) => {
    const { patient_id } = req.params;

    if (!patient_id) {
        return res.status(400).json({ error: 'Patient ID is required' });
    }
    

    // Call the Supabase RPC function
    const { data, error } = await supabase.rpc('display_prescription_id', { p_id: patient_id });

    if (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
        return res.status(404).json({ message: 'No prescriptions found for this patient' });
    }

    // Convert prescription_ids to strings to avoid truncation of large numbers
    const prescriptionIdsAsString = data.map(id => id.toString());

    return res.status(200).json({ prescription_ids: prescriptionIdsAsString });
};
const getPrescriptionById = async (req, res) => {
    const { id } = req.params; 
  
    try {
      const { data, error } = await supabase
        .from('prescription')
        .select('*')
        .eq('id', id) 
        .single(); 
  
      if (error) {
        return res.status(400).json({ error: error.message });
      }
  
      if (!data) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  };
const getPrescriptionDetails = async (req, res) => {
    const { id } = req.params; // Get the prescription ID from request parameters

    try {
        // Fetch the prescription details
        const { data: prescription, error: prescriptionError } = await supabase
            .from('prescription')
            .select('*') // You can specify the fields you need here
            .eq('id', id)
            .single(); // We expect a single result

        if (prescriptionError || !prescription) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        // Extract left and right eye IDs
        const { left_eye_id, right_eye_id } = prescription;

        // Fetch left eye details
        const { data: leftEye, error: leftEyeError } = await supabase
            .from('left_eye')
            .select('*')
            .eq('id', left_eye_id)
            .single();

        if (leftEyeError) {
            return res.status(404).json({ error: 'Left eye details not found' });
        }

        // Fetch right eye details
        const { data: rightEye, error: rightEyeError } = await supabase
            .from('right_eye')
            .select('*')
            .eq('id', right_eye_id)
            .single();

        if (rightEyeError) {
            return res.status(404).json({ error: 'Right eye details not found' });
        }

        // Combine the results
        const result = {
            prescription,
            leftEye,
            rightEye,
        };

        // Return the combined result
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
};
const addPrescription = async (req, res) => {
    // Extract necessary fields from request body
    const {
        p_id, // Patient ID
        d_id, // Doctor ID
        l_without_dv, l_without_nv, l_with_dv, l_with_nv,
        l_sphere_dv, l_cyl_dv, l_axis_dv, l_vision_dv,
        l_sphere_nv, l_cyl_nv, l_axis_nv, l_vision_nv, // Left eye params
        r_without_dv, r_without_nv, r_with_dv, r_with_nv,
        r_sphere_dv, r_cyl_dv, r_axis_dv, r_vision_dv,
        r_sphere_nv, r_cyl_nv, r_axis_nv, r_vision_nv, // Right eye params
        p_ipd, p_remarks, // Prescription-related fields
        bifocalOptions, // String of selected bifocal options
        p_colour        // String of selected colour options
    } = req.body;

    // Debug: Log incoming request body
    console.log('Received Request Body:', req.body);

    // Debug: Check bifocal and color strings
    console.log('Bifocal Options (String):', bifocalOptions);
    console.log('Color Options (String):', p_colour);

    try {
        // Call the Supabase RPC function for adding the prescription
        const { data, error } = await supabase.rpc('add_prescription', {
            p_id,
            d_id,
            l_without_dv,
            l_without_nv,
            l_with_dv,
            l_with_nv,
            l_sphere_dv,
            l_cyl_dv,
            l_axis_dv,
            l_vision_dv,
            l_sphere_nv,
            l_cyl_nv,
            l_axis_nv,
            l_vision_nv,
            r_without_dv,
            r_without_nv,
            r_with_dv,
            r_with_nv,
            r_sphere_dv,
            r_cyl_dv,
            r_axis_dv,
            r_vision_dv,
            r_sphere_nv,
            r_cyl_nv,
            r_axis_nv,
            r_vision_nv,
            p_ipd,
            p_bifocal: bifocalOptions, // Use the bifocal string directly
            p_colour,                   // Use the color string directly
            p_remarks
        });

        // Debug: Check if there's any error from Supabase
        console.log('Supabase Response:', data);
        if (error) {
            console.error('Supabase Error:', error);
            return res.status(500).json({ error: error.message });
        }

        // If the function was successful, return the prescription ID
        console.log('Prescription added successfully, ID:', data);
        return res.status(200).json({ message: 'Prescription added successfully', prescription_id: data });

    } catch (err) {
        // Handle server errors
        console.error('Server Error:', err);
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
};
const updateMedicalDetails = async (req, res) => {
    const { patient_id, medical_history, current_medication, allergies } = req.body;

    // Check if required parameters are present
    if (!patient_id) {
        return res.status(400).json({ error: 'Patient ID is required' });
    }

    try {
        // Fetch the existing details for the patient
        const { data: existingDetails, error: fetchError } = await supabase
            .from('additional_details')
            .select('*')
            .eq('patient_id', patient_id)
            .single();

        if (fetchError) {
            console.error('Error fetching existing details:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch existing details' });
        }

        // Prepare the new values
        const updatedMedicalHistory = existingDetails.medical_history ? 
            `${existingDetails.medical_history}, ${medical_history}` : medical_history;
        const updatedCurrentMedication = existingDetails.current_medication ? 
            `${existingDetails.current_medication}, ${current_medication}` : current_medication;
        const updatedAllergies = existingDetails.allergies ? 
            `${existingDetails.allergies}, ${allergies}` : allergies;

        // Update the details in the database
        const { error: updateError } = await supabase
            .from('additional_details')
            .update({
                medical_history: updatedMedicalHistory,
                current_medication: updatedCurrentMedication,
                allergies: updatedAllergies
            })
            .eq('patient_id', patient_id);

        if (updateError) {
            console.error('Error updating medical details:', updateError);
            return res.status(500).json({ error: 'Failed to update medical details' });
        }

        return res.status(200).json({ message: 'Medical details updated successfully' });

    } catch (err) {
        console.error('Server Error:', err);
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
};







export { getPrescriptionIds,getPrescriptionById,getPrescriptionDetails,addPrescription,updateMedicalDetails} 