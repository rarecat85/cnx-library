/**
 * pendingUsers 데이터 마이그레이션
 * 회원가입 완료 시 미가입자 상태의 대출/반납 기록을 새 사용자 ID로 연결
 * @param {string} newUserId - 새로 가입한 사용자 UID
 * @param {string} email - 사용자 이메일
 * @param {Object} firestore - Firestore 인스턴스
 */
async function migratePendingUserData(newUserId, email, firestore) {
  if (!newUserId || !email) return

  // 1. pendingUsers에서 해당 이메일 찾기
  const pendingSnapshot = await firestore.collection('pendingUsers')
    .where('email', '==', email)
    .get()

  if (pendingSnapshot.empty) {
    console.log(`마이그레이션 대상 없음: ${email}`)
    return
  }

  const pendingDoc = pendingSnapshot.docs[0]
  const pendingId = pendingDoc.id
  console.log(`마이그레이션 시작: ${email} (pending: ${pendingId} -> user: ${newUserId})`)

  // 2. rentalHistory 업데이트: pendingId -> newUserId
  const historySnapshot = await firestore.collection('rentalHistory')
    .where('userId', '==', pendingId)
    .where('userType', '==', 'pending')
    .get()

  for (const historyDoc of historySnapshot.docs) {
    await historyDoc.ref.update({
      userId: newUserId,
      userType: 'user'
    })
    console.log(`rentalHistory 마이그레이션: ${historyDoc.id}`)
  }

  // 3. 현재 대여중인 도서 업데이트
  const booksSnapshot = await firestore.collection('books')
    .where('rentedBy', '==', pendingId)
    .where('rentedByType', '==', 'pending')
    .get()

  for (const bookDoc of booksSnapshot.docs) {
    await bookDoc.ref.update({
      rentedBy: newUserId,
      rentedByType: 'user'
    })
    console.log(`books 대여정보 마이그레이션: ${bookDoc.id}`)
  }

  // 4. pendingUsers에서 삭제
  await pendingDoc.ref.delete()
  console.log(`pendingUsers 삭제 완료: ${pendingId}`)

  console.log(`마이그레이션 완료: ${email}`)
}

module.exports = { migratePendingUserData }
