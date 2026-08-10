import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { CheckCircle2, Image, LoaderCircle, LocateFixed, ShieldCheck } from 'lucide-react'
import { rememberPermissionWelcome } from '../services/appPermissions'
import { requestLocationAccess } from '../services/coupleLocation'
import Modal from './Modal'

export default function PermissionWelcomeModal({ onClose }) {
  const [requesting, setRequesting] = useState(false)
  const [locationStatus, setLocationStatus] = useState('waiting')
  const nativeApp = Capacitor.isNativePlatform()

  const finish = () => {
    rememberPermissionWelcome()
    onClose()
  }

  const requestPermissions = async () => {
    if (!nativeApp) {
      setLocationStatus('browser')
      return
    }

    setRequesting(true)
    const status = await requestLocationAccess()
    setLocationStatus(status)
    setRequesting(false)
  }

  return (
    <Modal title="权限与隐私" onClose={finish}>
      <div className="permission-welcome">
        <div className="permission-welcome__icon"><ShieldCheck size={31} /></div>
        <p>为了使用情侣距离地图，APP 需要定位权限。我们只会在你主动更新位置时读取一次，不会在后台持续跟踪。</p>

        <div className={`permission-item permission-item--${locationStatus}`}>
          <span><LocateFixed size={21} /></span>
          <div>
            <strong>位置信息</strong>
            <small>{locationStatus === 'granted' && '已允许，可以使用距离地图。'}
              {locationStatus === 'denied' && '未允许；以后可以到系统设置中重新开启。'}
              {locationStatus === 'browser' && '网页版会在你点击共享位置时由浏览器询问。'}
              {locationStatus === 'waiting' && '用于主动共享位置和计算两个人的距离。'}</small>
          </div>
          {locationStatus === 'granted' && <CheckCircle2 size={20} />}
        </div>

        <div className="permission-item permission-item--picker">
          <span><Image size={21} /></span>
          <div>
            <strong>照片与头像</strong>
            <small>上传时由手机系统选择照片，不会长期读取整个相册，因此无需提前授权。</small>
          </div>
          <CheckCircle2 size={20} />
        </div>

        <div className="permission-actions">
          {locationStatus === 'waiting' ? (
            <button type="button" className="button primary" onClick={requestPermissions} disabled={requesting}>
              {requesting ? <LoaderCircle className="spin" size={18} /> : <LocateFixed size={18} />}
              {requesting ? '正在请求权限…' : '允许需要的权限'}
            </button>
          ) : null}
          <button type="button" className="button secondary" onClick={finish} disabled={requesting}>
            {locationStatus === 'granted' || locationStatus === 'browser' ? '完成' : '稍后设置'}
          </button>
        </div>
        <small className="permission-footnote">通知权限会在系统推送功能正式接入后再单独申请，不会提前索取无用权限。</small>
      </div>
    </Modal>
  )
}
