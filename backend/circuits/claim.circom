pragma circom 2.0.0;

include "circoml ib/circuits/comparators.circom";

template ClaimVerification() {
    signal input amount;
    signal input coverAmount;
    signal input treatmentCode;
    signal input daysDiff;

    signal output amountValid;
    signal output treatmentValid;
    signal output timeValid;
    signal output allValid;

    // Check 1: amount < coverAmount
    component amtLt = LessThan(32);
    amtLt.in[0] <== amount;
    amtLt.in[1] <== coverAmount;
    amountValid <== amtLt.out;

    // Check 2: treatmentCode >= 1 AND <= 13
    component tcGt = GreaterThan(8);
    tcGt.in[0] <== treatmentCode;
    tcGt.in[1] <== 0;

    component tcLte = LessEqThan(8);
    tcLte.in[0] <== treatmentCode;
    tcLte.in[1] <== 13;

    treatmentValid <== tcGt.out * tcLte.out;

    // Check 3: daysDiff <= 90
    component dLte = LessEqThan(16);
    dLte.in[0] <== daysDiff;
    dLte.in[1] <== 90;
    timeValid <== dLte.out;

    // Check 4: allValid = amountValid AND treatmentValid AND timeValid
    signal av_tv;
    av_tv <== amountValid * treatmentValid;
    allValid <== av_tv * timeValid;
}

component main = ClaimVerification();