import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'
import { Readable } from 'stream'

async function getOrCreateFolder(drive: any, folderName: string, parentId?: string): Promise<string> {
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`
  if (parentId) {
    query += ` and '${parentId}' in parents`
  }
  
  const response = await drive.files.list({
    q: query,
    fields: 'files(id)',
    spaces: 'drive'
  })
  
  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!
  }
  
  const fileMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  }
  if (parentId) {
    fileMetadata.parents = [parentId]
  }
  
  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  })
  
  try {
    await drive.permissions.create({
      fileId: folder.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    })
  } catch (err) {
    console.warn('Failed to set public view permission on folder:', err)
  }
  
  return folder.data.id!
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null
    const activityId = formData.get('activityId') as string | null

    if (!file || !userId || !activityId) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 })
    }

    const activityObj = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        team: true,
        annualPlan: true
      }
    })

    if (!activityObj) {
      return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 404 })
    }

    const teamName = activityObj.team?.name || 'Umum'
    const activityName = activityObj.name

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeFileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    let fileLink = ''
    let driveFolderLink: string | null = null

    console.log('=== DIAGNOSTIK UPLOAD ===')
    console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'Tersedia' : 'TIDAK TERSEDIA')
    console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Tersedia' : 'TIDAK TERSEDIA')
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Tersedia' : 'TIDAK TERSEDIA')
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Tersedia' : 'TIDAK TERSEDIA')
    console.log('GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? 'Tersedia' : 'TIDAK TERSEDIA')
    console.log('GOOGLE_DRIVE_FOLDER_ID:', process.env.GOOGLE_DRIVE_FOLDER_ID ? 'Tersedia' : 'TIDAK TERSEDIA')

    const hasServiceAccount = 
      process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY

    const hasOAuth = 
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN

    if (hasOAuth) {
      try {
        console.log('Menggunakan Google OAuth2 Client untuk unggah berkas...')
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        )
        oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        })
        const drive = google.drive({ version: 'v3', auth: oauth2Client })

        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined
        const teamFolderId = await getOrCreateFolder(drive, `Tim - ${teamName}`, rootFolderId)
        const activityFolderId = await getOrCreateFolder(drive, `Kegiatan - ${activityName}`, teamFolderId)
        driveFolderLink = `https://drive.google.com/drive/folders/${activityFolderId}`

        const media = {
          mimeType: file.type,
          body: Readable.from(buffer)
        }

        const fileMetadata: any = {
          name: safeFileName,
          parents: [activityFolderId]
        }

        const driveResponse = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, webViewLink, webContentLink'
        })

        try {
          await drive.permissions.create({
            fileId: driveResponse.data.id!,
            requestBody: {
              role: 'reader',
              type: 'anyone'
            }
          })
        } catch (permErr) {
          console.warn('Failed to set public view permission on Google Drive file:', permErr)
        }

        const fileInfo = await drive.files.get({
          fileId: driveResponse.data.id!,
          fields: 'webViewLink, webContentLink'
        })

        fileLink = fileInfo.data.webViewLink || fileInfo.data.webContentLink || ''
      } catch (driveErr: any) {
        console.error('Google Drive OAuth upload failed:', driveErr)
      }
    } else if (hasServiceAccount) {
      try {
        console.log('Menggunakan Google Service Account untuk unggah berkas...')
        const auth = new google.auth.JWT({
          email: process.env.GOOGLE_CLIENT_EMAIL,
          key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file']
        })
        
        const drive = google.drive({ version: 'v3', auth })

        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined
        const teamFolderId = await getOrCreateFolder(drive, `Tim - ${teamName}`, rootFolderId)
        const activityFolderId = await getOrCreateFolder(drive, `Kegiatan - ${activityName}`, teamFolderId)
        driveFolderLink = `https://drive.google.com/drive/folders/${activityFolderId}`

        const media = {
          mimeType: file.type,
          body: Readable.from(buffer)
        }

        const fileMetadata: any = {
          name: safeFileName,
          parents: [activityFolderId]
        }

        const driveResponse = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, webViewLink, webContentLink'
        })

        try {
          await drive.permissions.create({
            fileId: driveResponse.data.id!,
            requestBody: {
              role: 'reader',
              type: 'anyone'
            }
          })
        } catch (permErr) {
          console.warn('Failed to set public view permission on Google Drive file:', permErr)
        }

        const fileInfo = await drive.files.get({
          fileId: driveResponse.data.id!,
          fields: 'webViewLink, webContentLink'
        })

        fileLink = fileInfo.data.webViewLink || fileInfo.data.webContentLink || ''
      } catch (driveErr: any) {
        console.error('Google Drive service account upload failed:', driveErr)
      }
    }

    if (!fileLink) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const filePath = path.join(uploadDir, safeFileName)
      fs.writeFileSync(filePath, buffer)

      fileLink = `/uploads/${safeFileName}`
    }

    // Always create a new evidence file to support uploading multiple files
    const evidenceFile = await prisma.evidenceFile.create({
      data: {
        fileName: file.name,
        driveLink: fileLink,
        uploadedById: userId
      }
    })

    // Link to activity
    await prisma.activityEvidence.create({
      data: {
        activityId,
        evidenceFileId: evidenceFile.id
      }
    })

    // Update activity status to MENUNGGU_BUKTI
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        status: 'MENUNGGU_BUKTI',
        dateSubmitted: new Date(),
        ...(driveFolderLink ? { googleDriveFolderLink: driveFolderLink } : {})
      }
    })

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'UPLOAD_EVIDENCE',
        details: `Mengunggah bukti dukung "${file.name}" untuk kegiatan: ${activityObj.name}`
      }
    })

    return NextResponse.json({ success: true, fileLink, fileName: file.name })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
