import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const upload = multer({ dest: 'uploads/' });

  app.use(express.json());

  // API routes
  app.post("/api/Login/LoginSystem", (req, res) => {
    const { userID, userPassword } = req.body;
    if (userID && userPassword) {
      res.json({
        code: 200,
        message: "登錄成功",
        data: {
          result: 1,
          token: "mock-jwt-token",
          user: { name: userID, role: "admin" }
        }
      });
    } else {
      res.status(400).json({ code: 400, message: "用戶名或密碼不能為空", data: { result: 0 } });
    }
  });

  app.post("/api/Line/EnterLine", (req, res) => {
    const { lineSystemName } = req.body;
    res.json({
      code: 200,
      message: "成功進入產綫",
      data: {
        lineSystemName: lineSystemName,
        site: "GL",
        floor: "3F",
        equipmentSet: [
          {
            IEquipment: {
              SystemName: "EQ-001",
              EquipmentName: "SMT 貼片機 01",
              TypeString: "SMT",
              Description: "高速貼片機",
              EquipmentSN: "SN-2024-001"
            }
          },
          {
            IEquipment: {
              SystemName: "EQ-002",
              EquipmentName: "AOI 檢測儀 01",
              TypeString: "AOI",
              Description: "自動光學檢測",
              EquipmentSN: "SN-2024-002"
            }
          }
        ]
      }
    });
  });

  app.post("/api/Factory/LoadProject", (req, res) => {
    res.json({
      code: 200,
      message: "項目加載成功",
      data: {
        lines: [],
        equipment: []
      }
    });
  });

  app.post("/api/Factory/SaveProject", (req, res) => {
    res.json({
      code: 200,
      message: "項目保存成功"
    });
  });

  app.post("/api/Factory/FactoryMaintenance", (req, res) => {
    res.json({
      code: 200,
      message: "工廠信息已成功保存"
    });
  });

  app.post("/api/Factory/CreateLine", (req, res) => {
    const { lineName } = req.body;
    res.json({
      code: 200,
      message: "產綫創建成功",
      data: {
        lineSystemName: `L-${Date.now()}`
      }
    });
  });

  app.post("/api/Line/LineMaintenance", (req, res) => {
    res.json({
      code: 200,
      message: "產綫配置更新成功"
    });
  });

  app.post("/api/Line/CreateEquipment", (req, res) => {
    res.json({
      code: 200,
      message: "設備新增成功",
      data: {
        equipmentSystemName: `E-${Date.now()}`
      }
    });
  });

  app.post("/api/Run/Running", (req, res) => {
    res.json({ code: 200, message: "運行狀態已切換" });
  });

  app.post("/api/CheckIn/AttendanceDataRefresh", (req, res) => {
    res.json({
      code: 200,
      message: "考勤數據已刷新",
      data: [
        { EmployeeID: "V001", EmployeeName: "王大錘", Department: "機構", AccessTime: new Date().toLocaleString() },
        { EmployeeID: "V042", EmployeeName: "李小美", Department: "電控", AccessTime: new Date().toLocaleString() }
      ]
    });
  });

  app.post("/api/CheckIn/UserDataRefresh", (req, res) => {
    res.json({
      code: 200,
      message: "人員信息已刷新",
      data: [
        { UserJobNO: "V001", UserName: "王大錘", Vender: "機構", UserJobName: "工程師", UserLevel: "3級", Finger1Status: "已錄入", Finger2Status: "已錄入", KeyMan: "是", ActiveMan: "否" }
      ]
    });
  });

  app.post("/api/CheckIn/CheckInBegin", (req, res) => {
    res.json({ code: 200, message: "打卡已啟動" });
  });

  app.post("/api/CheckIn/CheckInEnd", (req, res) => {
    res.json({ code: 200, message: "打卡已停止" });
  });

  app.post("/api/CheckIn/MakeUpVerification", (req, res) => {
    res.json({
      code: 200,
      message: "驗證成功",
      data: { name: "張三", employeeId: "V089" }
    });
  });

  app.post("/api/CheckIn/MakeUpRecord", (req, res) => {
    res.json({ code: 200, message: "補卡成功" });
  });

  app.post("/api/CheckIn/MakeUpCancel", (req, res) => {
    res.json({ code: 200, message: "操作已取消" });
  });

  app.post("/api/factory/upload", upload.single('factoryFile'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: "No file uploaded" });
    }

    try {
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Simulate parsing .factory file
      // We expect the file to contain JSON with lines and equipment
      const parsedData = JSON.parse(fileContent);
      
      // Clean up
      fs.unlinkSync(filePath);

      res.json({
        code: 200,
        message: "工廠文件解析成功",
        data: parsedData
      });
    } catch (error: any) {
      res.status(500).json({ code: 500, message: "文件解析失敗: " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve("dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
