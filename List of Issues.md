List of Issues

1. [MORE INFO NEEDED] Upon adding record of arrest in a case initiated, it asks several fields, one such field is "Signature of Arrested Person", since there is no option to upload the signature, it is to be examined whether the filed is necessary refer image inserted at sheet 2
   STATUS: Signature field removed from Arrest Register (no upload support exists). If a digital signature upload is required in future, please confirm and a file-upload field can be added.

2. [MORE INFO NEEDED] Upon adding record of arrest in a case initiated, several different details are asked to be inputted in a single input box. For Example "Name, Designation, Age of Arrested Person" and "Relatives Intimated (Name/Addr/Tel)". to be examined if bifurcation is required for proper data entry and reporting refer image inserted at sheet 2
   STATUS: Needs DB migration. Please confirm whether to split:
   - "Name, Designation, Age" → separate Name / Designation / Age fields
   - "Relatives Intimated" → separate Name / Address / Phone fields
   Once confirmed, migration + UI can be done.

3. [COMPLETED] In the entire application wherever amount is required to be inputted, the application allows entry of alphabets as well. All over the application
   STATUS: All amount/monetary fields (Detection, Recovery ITC/Cash, Demand Tax/Interest/Penalty, Amount in Crore, Expected Liability, Attachment values) now reject non-numeric input.

4. [COMPLETED] Unable to add Provisional Attachment data in the application in a NON-IR case refer image inserted at sheet 2
   STATUS: Fixed — the "Related Registers" stage in the NON-IR edit form is now always accessible regardless of whether earlier stage fields are filled.

5. [COMPLETED] When adding inputs in the provisional attachment tab, consolidated data is being asked, examine feasibility of itemised inputs seperately for each category such as immovable property, moval property, bank account, shares etc refer image inserted at sheet 2
   STATUS: Already implemented — Provisional Attachment form has separate fields for Immovable, Movable, Shares/FD, Bank A/c, Third Party, Others, and Total.

6. [COMPLETED] When Non-IR case is opened and you switch to the adjacent IR tab and click save, the case starts appearing in IR page at the homepage with the NON-IR number(causes confusion) / Alternatively, it is not intuitive how to convert the case into IR case refer image inserted at sheet 2
   STATUS: Fixed — Case Type (IR/NON-IR) is now locked in edit mode and cannot be accidentally toggled. To convert NON-IR → IR, set Closure Reason = "Converted to IR".

7. [COMPLETED] When adding a new IR, the portal requires input of Detection and Recovery amounts in "Rs." terms; the same amount is subsequently auto-populated in related registers i.e. "Arrest Register" and "Provisional Attachment" register. However, the same auto-populated amount recorded in Rupee terms therein is displayed in "Rs Crores" instead of "Rs" refer image inserted at sheet 2
   STATUS: Fixed — auto-populated amounts from IR (stored in Rs.) are now correctly converted to Crores (÷ 1,00,00,000) when pre-filling Arrest Register and Provisional Attachment fields.

8. [COMPLETED] Unable to add Provisional Attachment data in the application in a NON-IR case, no error shown in website refer image inserted at sheet 2
   STATUS: Same as Issue 4 — fixed.

9. [MORE INFO NEEDED] When adding SCN details in an IR, the webpage asks for input of "Penalty" and "Interest". To examine if these inputs are requested as they are dynamin in nature refer image inserted at sheet 2
   STATUS: Penalty and Interest fields currently remain as optional numeric inputs. Please clarify: should they be removed, made read-only/calculated, or remain as manual inputs?

10. [COMPLETED] After inputing details of the SCN, there is no apparent option to close the case and the same remains pending as an IR entry
    STATUS: Fixed — IR form now includes "Due Date / Closure Date", "Closure Reason" (Merit / Tax Payment / Transfer / Show Cause Notice), "Latest Status", and "PR/ADG Comments" fields. Setting a Closure Reason removes the case from the pending list.

11. [COMPLETED] Date entry into various fields in the application is allowed only through graphical interface(Date Picker Dialogue). The current Date Picker Dialogue is slow moving as it does not allowing going to a specific month. Date entry may also be allowed through keyboard in addition to the available Date Picker All over the application
    STATUS: Fixed on two fronts — (1) Calendar now has month/year dropdowns for fast navigation (2000–2040 range). (2) All date fields in dialogs now use a hybrid DateInput component that accepts keyboard typing in dd/mm/yyyy format with auto-slash insertion, plus a calendar icon for picker access.

12. [COMPLETED] "Adjudication Formation" and "Adjudication Status" asked in the reports may be standardized with pre-dtermined options to ensure easier reporting refer image inserted at sheet 2
    STATUS: Both fields now use predefined dropdowns with an "Others" fallback:
    - Adjudication Formation: DC/AC, JC/ADC, Commissioner, Principal Commissioner, CESTAT
    - Adjudication Status: Pending, OIO Issued, Dropped, Partly Confirmed, Fully Confirmed, Remanded Back, Appeal Pending, Disposed

13. [MORE INFO NEEDED] After inputing details of the SCN, there is no apparent option to close the case and the same remains pending as an IR entry
    STATUS: See Issue 10 — Closure fields added to IR form. If there is a separate SCN-level closure (distinct from case closure), please clarify what that should look like.
