export function useEnergyCalculations() {
    function calculateDailyCost(energy: number) {
      // โค้ดคำนวณค่าไฟรายวันที่มีอยู่เดิม
    }
  
    function calculateMonthlyCost(energy: number) {
      // โค้ดคำนวณค่าไฟรายเดือนที่มีอยู่เดิม
    }
  
    return {
      calculateDailyCost,
      calculateMonthlyCost
    }
  }